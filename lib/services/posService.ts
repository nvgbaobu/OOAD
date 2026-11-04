// Nghiệp vụ bán hàng tại quầy (POS).
// Giỏ hàng = hóa đơn DANG_LAP trong DB (mỗi nhân viên tối đa 1 đơn đang lập).
// Quy tắc kho: thêm vào đơn → tăng soLuongTamGiu; thanh toán → trừ soLuongTon + giải phóng tạm giữ;
// hủy đơn → giải phóng tạm giữ. Tính tiền dùng chung lib/services/tinhTienHoaDon.ts.
import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/db";
import { sachRepository } from "@/lib/repositories/sachRepository";
import { hoaDonRepository } from "@/lib/repositories/hoaDonRepository";
import { khachHangRepository } from "@/lib/repositories/khachHangRepository";
import { maGiamGiaRepository } from "@/lib/repositories/maGiamGiaRepository";
import { cauHinhRepository } from "@/lib/repositories/cauHinhRepository";
import { comboRepository } from "@/lib/repositories/comboRepository";
import { nhatKyRepository } from "@/lib/repositories/nhatKyRepository";
import { khachHangService, LoiKhachHang, SDT_HOP_LE } from "@/lib/services/khachHangService";
import { tinhTienHoaDon, LoiTinhTien, type KetQuaTinhTien, type ComboTinhTien } from "@/lib/services/tinhTienHoaDon";

/** Lỗi nghiệp vụ – thông điệp hiển thị thẳng cho người dùng. */
export class LoiPOS extends Error {}
/** SĐT chưa đăng ký → POS mở form tạo nhanh khách hàng (UC3.1 luồng 7a). */
export class KhongTimThayKhachHang extends LoiPOS {
  constructor(public soDienThoai: string) {
    super(`Số điện thoại ${soDienThoai} chưa đăng ký thành viên`);
  }
}

export type PhuongThucTT = "TIEN_MAT" | "QUET_THE" | "MA_QR";
export const TEN_PHUONG_THUC: Record<PhuongThucTT, string> = { TIEN_MAT: "Tiền mặt", QUET_THE: "Quẹt thẻ", MA_QR: "Mã QR" };

type DonDangLap = NonNullable<Awaited<ReturnType<typeof hoaDonRepository.layDonDangLap>>>;
type CauHinh = Awaited<ReturnType<typeof cauHinhRepository.lay>>;
/** Cấu hình + combo còn hiệu lực – những thứ cần để tính tiền. */
type BoiCanh = { cauHinh: CauHinh; combos: ComboTinhTien[] };

async function layBoiCanh(db: Db = prisma): Promise<BoiCanh> {
  const [cauHinh, combos] = await Promise.all([cauHinhRepository.lay(db), comboRepository.layConHieuLuc(db)]);
  return {
    cauHinh,
    combos: combos.map((c) => ({
      tenCombo: c.tenCombo, giaCombo: Number(c.giaCombo),
      sach: c.chiTiets.map((ct) => ({ maSach: ct.maSach, soLuong: ct.soLuong })),
    })),
  };
}

const MODULE = "BAN_HANG";

/** Đơn đang lập không được sửa quá số phút này sẽ tự hủy (giải phóng tạm giữ). */
export const HAN_DON_NHAP_PHUT = 30;
export const LY_DO_HUY = {
  NHAN_VIEN: "Nhân viên hủy đơn đang lập",
  DANG_XUAT: "Hủy khi nhân viên đăng xuất",
  QUA_HAN: "Tự động hủy do quá thời gian",
} as const;

/**
 * Hủy 1 đơn nháp: DANG_LAP → DA_HUY (UPDATE có điều kiện, chạy 2 lần cũng chỉ giải phóng 1 lần),
 * giải phóng tạm giữ, ghi nhật ký. Trả về false nếu đơn không còn DANG_LAP (đã bị hủy/thanh toán).
 */
async function huyDonNhap(tx: Db, don: { maHD: number; maTK: number }, lyDo: string, chiHuyNeuTruoc?: Date) {
  const n = chiHuyNeuTruoc
    ? await tx.$executeRaw`UPDATE HoaDon SET trangThai = N'DA_HUY', lyDoHuy = ${lyDo}, thoiGianCapNhat = SYSDATETIME()
        WHERE maHD = ${don.maHD} AND trangThai = N'DANG_LAP' AND thoiGianCapNhat < ${chiHuyNeuTruoc}`
    : await tx.$executeRaw`UPDATE HoaDon SET trangThai = N'DA_HUY', lyDoHuy = ${lyDo}, thoiGianCapNhat = SYSDATETIME()
        WHERE maHD = ${don.maHD} AND trangThai = N'DANG_LAP'`;
  if (n !== 1) return false;
  const chiTiets = await tx.chiTietHoaDon.findMany({ where: { maHD: don.maHD } });
  for (const c of chiTiets) await sachRepository.giamTamGiu(tx, c.maSach, c.soLuong);
  await nhatKyRepository.ghi(
    { maTK: don.maTK, module: MODULE, hanhDong: "HUY_DON_DANG_LAP", noiDung: `Đơn nháp #${don.maHD} (${chiTiets.length} dòng) – ${lyDo}` },
    tx,
  );
  return true;
}

/**
 * Dọn dẹp lười (lazy cleanup): hủy mọi đơn DANG_LAP quá hạn. Gọi trước mỗi thao tác POS – không cần job nền.
 * Trả về các đơn vừa bị hủy.
 */
async function huyDonQuaHan() {
  const moc = new Date(Date.now() - HAN_DON_NHAP_PHUT * 60_000);
  const quaHan = await prisma.hoaDon.findMany({
    where: { trangThai: "DANG_LAP", thoiGianCapNhat: { lt: moc } },
    select: { maHD: true, maTK: true },
  });
  const daHuy: typeof quaHan = [];
  for (const don of quaHan) {
    if (await prisma.$transaction((tx) => huyDonNhap(tx, don, LY_DO_HUY.QUA_HAN, moc))) daHuy.push(don);
  }
  return daHuy;
}

/** Chạy dọn dẹp; nếu chính đơn của nhân viên này vừa bị tự hủy thì báo để họ biết giỏ đã bị làm mới. */
async function donDepTruocThaoTac(maTK: number) {
  // Đơn của chính nhân viên vừa bị hủy trong lần dọn này → dừng lại để họ biết giỏ đã mất (bấm lại sẽ lập đơn mới)
  const cuaToi = (await huyDonQuaHan()).find((d) => d.maTK === maTK);
  if (cuaToi) {
    const tuHuy = await donTuHuyGanDay(prisma, maTK);
    throw new LoiPOS(`${tuHuy ? thongBaoTuHuy(tuHuy) : `Đơn #${cuaToi.maHD} đã tự hủy.`} Hãy lập đơn mới.`);
  }
}

/** Đơn của nhân viên bị tự hủy trong 10 phút gần đây (bởi bất kỳ request nào) – để báo cho họ biết. */
async function donTuHuyGanDay(db: Db, maTK: number) {
  return db.hoaDon.findFirst({
    where: { maTK, trangThai: "DA_HUY", lyDoHuy: LY_DO_HUY.QUA_HAN, thoiGianCapNhat: { gte: new Date(Date.now() - 10 * 60_000) } },
    orderBy: { maHD: "desc" },
    select: { maHD: true, thoiGianCapNhat: true },
  });
}
const thongBaoTuHuy = (d: { maHD: number; thoiGianCapNhat: Date }) =>
  `Đơn #${d.maHD} đã tự hủy lúc ${d.thoiGianCapNhat.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ` +
  `do quá ${HAN_DON_NHAP_PHUT} phút không cập nhật, sách đã trả về kho.`;

/** Đánh dấu đơn vừa được sửa (gia hạn thêm HAN_DON_NHAP_PHUT phút). */
const chamDon = (db: Db, maHD: number) => db.hoaDon.update({ where: { maHD }, data: { thoiGianCapNhat: new Date() } });

// ───────────── Hàm phụ ─────────────

function kiemTraMaConHieuLuc(ma: { trangThai: string; ngayBatDau: Date; ngayKetThuc: Date; daSuDung: number; soLuongToiDa: number }) {
  const bayGio = new Date();
  if (ma.trangThai !== "HOAT_DONG") return "Mã giảm giá đã ngừng hoạt động";
  if (bayGio < ma.ngayBatDau) return "Mã giảm giá chưa đến ngày áp dụng";
  if (bayGio > ma.ngayKetThuc) return "Mã giảm giá đã hết hạn";
  if (ma.daSuDung >= ma.soLuongToiDa) return "Mã giảm giá đã hết lượt sử dụng";
  return null;
}

/** Tính tiền cho đơn đang lập; ném LoiTinhTien nếu mã/điểm không còn hợp lệ. */
function tinhTienDon(don: DonDangLap, { cauHinh, combos }: BoiCanh, ghiDe?: { maGiamGia?: DonDangLap["maGiamGia"]; diemSuDung?: number }): KetQuaTinhTien {
  const ma = ghiDe && "maGiamGia" in ghiDe ? ghiDe.maGiamGia : don.maGiamGia;
  const kh = don.khachHang;
  return tinhTienHoaDon({
    dong: don.chiTiets.map((c) => ({
      maSach: c.maSach, soLuong: c.soLuong, donGia: Number(c.donGiaBan),
      thanhTien: Number(c.thanhTien), thueSuatVAT: Number(c.thueSuatVAT),
    })),
    combos,
    phanTramUuDaiHang: kh ? Number(kh.hangThanhVien.phanTramUuDai) : 0,
    maGiamGia: ma
      ? { loaiGiam: ma.loaiGiam as "PHAN_TRAM" | "SO_TIEN", giaTriGiam: Number(ma.giaTriGiam), giaTriDonToiThieu: Number(ma.giaTriDonToiThieu) }
      : null,
    diemSuDung: ghiDe?.diemSuDung ?? don.diemSuDung,
    diemHienTai: kh?.diemHienTai ?? 0,
    giaTriMotDiem: Number(cauHinh.giaTriMotDiem),
    tyLeQuyDoiDiem: Number(cauHinh.tyLeQuyDoiDiem),
    coKhachHang: !!kh,
  });
}

async function layHoacTaoDon(db: Db, maTK: number) {
  const don = await hoaDonRepository.layDonDangLap(db, maTK);
  if (don) return don;
  await hoaDonRepository.taoDonDangLap(db, maTK);
  return (await hoaDonRepository.layDonDangLap(db, maTK))!;
}

async function layDonBatBuoc(db: Db, maTK: number) {
  const don = await hoaDonRepository.layDonDangLap(db, maTK);
  if (!don) {
    const tuHuy = await donTuHuyGanDay(db, maTK);
    throw new LoiPOS(tuHuy ? `${thongBaoTuHuy(tuHuy)} Hãy lập đơn mới.` : "Chưa có đơn đang lập");
  }
  return don;
}

// ───────────── Nghiệp vụ ─────────────

export const posService = {
  timSach: (tuKhoa: string) => sachRepository.timDeBan(tuKhoa),

  /** Hóa đơn để xem/in. Staff chỉ xem được hóa đơn của mình. */
  async xemHoaDon(maHD: number, nguoiXem: { maTK: number; vaiTro: string }) {
    const hd = await hoaDonRepository.layHoaDonDayDu(maHD);
    if (!hd || hd.trangThai === "DANG_LAP") return null;
    if (nguoiXem.vaiTro !== "ADMIN" && hd.maTK !== nguoiXem.maTK) return null;
    return hd;
  },

  /** Dữ liệu màn hình POS: đơn đang lập + tiền + cấu hình thanh toán. */
  async layGioHang(maTK: number) {
    await huyDonQuaHan();
    const tuHuy = await donTuHuyGanDay(prisma, maTK);
    const thongBao = tuHuy ? thongBaoTuHuy(tuHuy) : null;
    const [don, boiCanh] = await Promise.all([hoaDonRepository.layDonDangLap(prisma, maTK), layBoiCanh()]);
    const { cauHinh } = boiCanh;
    const phuongThuc = (Object.keys(TEN_PHUONG_THUC) as PhuongThucTT[]).filter(
      (p) => ({ TIEN_MAT: cauHinh.ttTienMat, QUET_THE: cauHinh.ttQuetThe, MA_QR: cauHinh.ttMaQR })[p],
    );
    if (!don) return { don: null, tien: null, canhBao: null, thongBao, hetHanLuc: null, phuongThuc, giaTriMotDiem: Number(cauHinh.giaTriMotDiem) };

    let canhBao: string | null = null;
    let tien: KetQuaTinhTien;
    try {
      tien = tinhTienDon(don, boiCanh);
    } catch (e) {
      if (!(e instanceof LoiTinhTien)) throw e;
      // Vd: bớt sách làm đơn không còn đạt mức tối thiểu của mã → hiển thị cảnh báo, tạm tính không mã/điểm
      canhBao = e.message;
      tien = tinhTienDon(don, boiCanh, { maGiamGia: null, diemSuDung: 0 });
    }
    const hetHanLuc = new Date(don.thoiGianCapNhat.getTime() + HAN_DON_NHAP_PHUT * 60_000);
    return { don, tien, canhBao, thongBao, hetHanLuc, phuongThuc, giaTriMotDiem: Number(cauHinh.giaTriMotDiem) };
  },

  async themSach(maTK: number, maSach: number, soLuong = 1) {
    if (!Number.isInteger(soLuong) || soLuong <= 0) throw new LoiPOS("Số lượng không hợp lệ");
    await donDepTruocThaoTac(maTK);
    await prisma.$transaction(async (tx) => {
      const sach = await sachRepository.timTheoMa(tx, maSach);
      if (!sach || sach.trangThai !== "DANG_BAN") throw new LoiPOS("Sách không tồn tại hoặc đã ngừng kinh doanh");
      if (!(await sachRepository.tangTamGiu(tx, maSach, soLuong))) {
        throw new LoiPOS(`"${sach.tenSach}" chỉ còn ${sach.soLuongTon - sach.soLuongTamGiu} cuốn có thể bán`);
      }
      const don = await layHoacTaoDon(tx, maTK);
      await chamDon(tx, don.maHD);
      const dong = await hoaDonRepository.layChiTiet(tx, don.maHD, maSach);
      if (dong) {
        const soLuongMoi = dong.soLuong + soLuong;
        await tx.chiTietHoaDon.update({
          where: { maHD_maSach: { maHD: don.maHD, maSach } },
          data: { soLuong: soLuongMoi, thanhTien: Number(dong.donGiaBan) * soLuongMoi },
        });
      } else {
        // Snapshot giá bán + thuế suất tại thời điểm thêm vào đơn
        await tx.chiTietHoaDon.create({
          data: {
            maHD: don.maHD, maSach, soLuong,
            donGiaBan: sach.giaBan, thanhTien: Number(sach.giaBan) * soLuong, thueSuatVAT: sach.theLoai.thueSuatVAT,
          },
        });
      }
    });
  },

  /** Đặt số lượng mới cho 1 dòng (0 = xóa dòng). */
  async capNhatSoLuong(maTK: number, maSach: number, soLuongMoi: number) {
    if (!Number.isInteger(soLuongMoi) || soLuongMoi < 0) throw new LoiPOS("Số lượng không hợp lệ");
    await donDepTruocThaoTac(maTK);
    await prisma.$transaction(async (tx) => {
      const don = await layDonBatBuoc(tx, maTK);
      await chamDon(tx, don.maHD);
      const dong = await hoaDonRepository.layChiTiet(tx, don.maHD, maSach);
      if (!dong) throw new LoiPOS("Sách không có trong đơn");
      const chenh = soLuongMoi - dong.soLuong;
      if (chenh > 0 && !(await sachRepository.tangTamGiu(tx, maSach, chenh))) {
        const sach = await sachRepository.timTheoMa(tx, maSach);
        throw new LoiPOS(`Chỉ còn thêm được ${sach ? sach.soLuongTon - sach.soLuongTamGiu : 0} cuốn`);
      }
      if (chenh < 0) await sachRepository.giamTamGiu(tx, maSach, -chenh);
      if (soLuongMoi === 0) {
        await tx.chiTietHoaDon.delete({ where: { maHD_maSach: { maHD: don.maHD, maSach } } });
      } else {
        await tx.chiTietHoaDon.update({
          where: { maHD_maSach: { maHD: don.maHD, maSach } },
          data: { soLuong: soLuongMoi, thanhTien: Number(dong.donGiaBan) * soLuongMoi },
        });
      }
    });
  },

  async chonKhachHang(maTK: number, soDienThoai: string) {
    await donDepTruocThaoTac(maTK);
    if (!SDT_HOP_LE.test(soDienThoai)) throw new LoiPOS("Số điện thoại gồm 10 chữ số, bắt đầu bằng 0");
    const kh = await khachHangRepository.timTheoSoDienThoai(prisma, soDienThoai);
    if (!kh) throw new KhongTimThayKhachHang(soDienThoai);
    const don = await layHoacTaoDon(prisma, maTK);
    await prisma.hoaDon.update({ where: { maHD: don.maHD }, data: { maKH: kh.maKH, diemSuDung: 0, thoiGianCapNhat: new Date() } });
  },

  /** Tạo nhanh khách hàng tại quầy rồi gắn vào đơn đang lập. */
  async taoNhanhKhachHang(maTK: number, soDienThoai: string, hoTen: string) {
    await donDepTruocThaoTac(maTK);
    await prisma.$transaction(async (tx) => {
      let kh;
      try {
        kh = await khachHangService.taoMoi({ soDienThoai, hoTen }, maTK, tx);
      } catch (e) {
        if (e instanceof LoiKhachHang) throw new LoiPOS(e.message);
        throw e;
      }
      const don = await layHoacTaoDon(tx, maTK);
      await tx.hoaDon.update({ where: { maHD: don.maHD }, data: { maKH: kh.maKH, diemSuDung: 0, thoiGianCapNhat: new Date() } });
    });
  },

  async boKhachHang(maTK: number) {
    await donDepTruocThaoTac(maTK);
    const don = await layDonBatBuoc(prisma, maTK);
    await prisma.hoaDon.update({ where: { maHD: don.maHD }, data: { maKH: null, diemSuDung: 0, thoiGianCapNhat: new Date() } });
  },

  async apMaGiamGia(maTK: number, maCode: string) {
    await donDepTruocThaoTac(maTK);
    const [don, boiCanh] = await Promise.all([layDonBatBuoc(prisma, maTK), layBoiCanh()]);
    const ma = await maGiamGiaRepository.timTheoCode(prisma, maCode);
    if (!ma) throw new LoiPOS(`Mã "${maCode}" không tồn tại`);
    const loi = kiemTraMaConHieuLuc(ma);
    if (loi) throw new LoiPOS(loi);
    try {
      tinhTienDon(don, boiCanh, { maGiamGia: ma, diemSuDung: 0 }); // kiểm tra đơn tối thiểu
    } catch (e) {
      if (e instanceof LoiTinhTien) throw new LoiPOS(e.message);
      throw e;
    }
    // Đổi mã → bỏ điểm đã nhập (thứ tự áp: hạng → mã → điểm), nhân viên nhập lại điểm nếu cần
    await prisma.hoaDon.update({ where: { maHD: don.maHD }, data: { maMGG: ma.maMGG, diemSuDung: 0, thoiGianCapNhat: new Date() } });
  },

  async boMaGiamGia(maTK: number) {
    await donDepTruocThaoTac(maTK);
    const don = await layDonBatBuoc(prisma, maTK);
    await prisma.hoaDon.update({ where: { maHD: don.maHD }, data: { maMGG: null, thoiGianCapNhat: new Date() } });
  },

  async datDiemSuDung(maTK: number, diem: number) {
    if (!Number.isInteger(diem) || diem < 0) throw new LoiPOS("Số điểm không hợp lệ");
    await donDepTruocThaoTac(maTK);
    const [don, boiCanh] = await Promise.all([layDonBatBuoc(prisma, maTK), layBoiCanh()]);
    if (!don.khachHang) throw new LoiPOS("Chọn khách hàng thành viên trước khi đổi điểm");
    try {
      tinhTienDon(don, boiCanh, { diemSuDung: diem });
    } catch (e) {
      if (e instanceof LoiTinhTien) throw new LoiPOS(e.message);
      throw e;
    }
    await prisma.hoaDon.update({ where: { maHD: don.maHD }, data: { diemSuDung: diem, thoiGianCapNhat: new Date() } });
  },

  /** Nhân viên bấm Hủy đơn: DA_HUY + giải phóng tạm giữ. */
  async huyDon(maTK: number) {
    await donDepTruocThaoTac(maTK);
    await prisma.$transaction(async (tx) => {
      const don = await layDonBatBuoc(tx, maTK);
      await huyDonNhap(tx, don, LY_DO_HUY.NHAN_VIEN);
    });
  },

  /** Số sách trong đơn đang lập (để cảnh báo "Đơn hàng chưa hoàn tất" khi đăng xuất). */
  async soSachDonDangLap(maTK: number) {
    const don = await prisma.hoaDon.findFirst({
      where: { maTK, trangThai: "DANG_LAP" },
      select: { _count: { select: { chiTiets: true } } },
    });
    return don?._count.chiTiets ?? 0;
  },

  /** Đăng xuất: hủy đơn nháp (nếu có) để giải phóng tạm giữ. */
  async huyDonKhiDangXuat(maTK: number) {
    const don = await hoaDonRepository.layDonDangLap(prisma, maTK);
    if (don) await prisma.$transaction((tx) => huyDonNhap(tx, don, LY_DO_HUY.DANG_XUAT));
  },

  /** Thanh toán đơn đang lập. Trả về maHD để in hóa đơn. */
  async thanhToan(maTK: number, phuongThucTT: PhuongThucTT, tienKhachDua: number | null) {
    await donDepTruocThaoTac(maTK);
    return prisma.$transaction(async (tx) => {
      const [don, boiCanh] = await Promise.all([layDonBatBuoc(tx, maTK), layBoiCanh(tx)]);
      const { cauHinh } = boiCanh;
      if (don.chiTiets.length === 0) throw new LoiPOS("Đơn hàng chưa có sách");

      const batPhuongThuc = { TIEN_MAT: cauHinh.ttTienMat, QUET_THE: cauHinh.ttQuetThe, MA_QR: cauHinh.ttMaQR };
      if (!batPhuongThuc[phuongThucTT]) throw new LoiPOS("Phương thức thanh toán không được bật");

      // Kiểm tra lại mã giảm giá lúc thanh toán (có thể đã hết lượt/hết hạn từ lúc áp)
      if (don.maGiamGia) {
        const loi = kiemTraMaConHieuLuc(don.maGiamGia);
        if (loi) throw new LoiPOS(`${loi}. Hãy bỏ mã rồi thanh toán lại`);
      }

      let tien: KetQuaTinhTien;
      try {
        tien = tinhTienDon(don, boiCanh);
      } catch (e) {
        if (e instanceof LoiTinhTien) throw new LoiPOS(e.message);
        throw e;
      }

      if (phuongThucTT === "TIEN_MAT") {
        if (tienKhachDua == null || !Number.isFinite(tienKhachDua)) throw new LoiPOS("Nhập số tiền khách đưa");
        if (tienKhachDua < tien.tongTien) throw new LoiPOS("Tiền khách đưa chưa đủ");
      }

      // Kho: trừ tồn + giải phóng tạm giữ
      for (const c of don.chiTiets) {
        if (!(await sachRepository.xuatBan(tx, c.maSach, c.soLuong))) {
          throw new LoiPOS(`Không đủ tồn kho cho "${c.sach.tenSach}"`);
        }
      }

      if (don.maGiamGia && !(await maGiamGiaRepository.tangLuotDung(tx, don.maGiamGia.maMGG))) {
        throw new LoiPOS("Mã giảm giá vừa hết lượt sử dụng. Hãy bỏ mã rồi thanh toán lại");
      }

      // Điểm khách hàng: trừ điểm đã dùng, cộng điểm mới, xét thăng hạng
      if (don.khachHang) {
        const kh = don.khachHang;
        const diemTichLuy = kh.diemTichLuy + tien.diemCong;
        const hang = await khachHangRepository.hangTheoDiem(tx, diemTichLuy);
        await tx.khachHang.update({
          where: { maKH: kh.maKH },
          data: {
            diemHienTai: kh.diemHienTai - don.diemSuDung + tien.diemCong,
            diemTichLuy,
            ...(hang && hang.diemToiThieu > kh.hangThanhVien.diemToiThieu && { maHang: hang.maHang }),
          },
        });
      }

      // Có điều kiện: nếu đơn vừa bị tự hủy ở request khác thì rollback toàn bộ
      const capNhat = await tx.hoaDon.updateMany({
        where: { maHD: don.maHD, trangThai: "DANG_LAP" },
        data: {
          trangThai: "DA_THANH_TOAN",
          thoiGianTao: new Date(), // = thời điểm thanh toán (dùng cho báo cáo doanh thu)
          thoiGianCapNhat: new Date(),
          tamTinh: tien.tamTinh, giamCombo: tien.giamCombo, giamHangThe: tien.giamHang, giamMaGiamGia: tien.giamMa,
          giamDiem: tien.giamDiem, thueVAT: tien.thueVAT, tongTien: tien.tongTien,
          diemCong: tien.diemCong, phuongThucTT,
          tienKhachDua: phuongThucTT === "TIEN_MAT" ? tienKhachDua : tien.tongTien,
        },
      });

      if (capNhat.count !== 1) throw new LoiPOS("Đơn không còn ở trạng thái đang lập (có thể đã tự hủy). Hãy lập đơn mới.");

      await nhatKyRepository.ghi(
        { maTK, module: MODULE, hanhDong: "THANH_TOAN", noiDung: `HĐ #${don.maHD}, tổng ${tien.tongTien}đ, ${phuongThucTT}` },
        tx,
      );
      return don.maHD;
    });
  },
};
