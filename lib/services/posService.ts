// Nghiệp vụ bán hàng tại quầy (POS).
// Giỏ hàng = hóa đơn DANG_LAP trong DB (mỗi nhân viên tối đa 1 đơn đang lập).
// Quy tắc kho: thêm vào đơn → tăng soLuongTamGiu; thanh toán → trừ soLuongTon + giải phóng tạm giữ;
// hủy đơn → giải phóng tạm giữ. Tính tiền dùng chung lib/services/tinhTienHoaDon.ts.
import { prisma } from "@/lib/prisma";
import { LoiNghiepVu } from "@/lib/loi";
import type { Db } from "@/lib/db";
import { sachRepository } from "@/lib/repositories/sachRepository";
import { hoaDonRepository } from "@/lib/repositories/hoaDonRepository";
import { cauHinhRepository } from "@/lib/repositories/cauHinhRepository";
import { comboRepository } from "@/lib/repositories/comboRepository";
import { khachHangService, LoiKhachHang, SDT_HOP_LE } from "@/lib/services/khachHangService";
import { LoiTinhTien, type KetQuaTinhTien, type ComboTinhTien } from "@/lib/services/tinhTienHoaDon";
import { Sach } from "@/lib/entities/Sach";
import { HoaDon } from "@/lib/entities/HoaDon";
import { ChiTietHoaDon } from "@/lib/entities/ChiTietHoaDon";
import { KhachHang } from "@/lib/entities/KhachHang";
import { HangThanhVien } from "@/lib/entities/HangThanhVien";
import { MaGiamGia } from "@/lib/entities/MaGiamGia";
import { CauHinhHeThong } from "@/lib/entities/CauHinhHeThong";
import { NhatKyHeThong } from "@/lib/entities/NhatKyHeThong";

/** Lỗi nghiệp vụ – thông điệp hiển thị thẳng cho người dùng. */
export class LoiPOS extends LoiNghiepVu {}
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
  KHOA_TAI_KHOAN: "Hủy do tài khoản nhân viên bị khóa",
} as const;

/**
 * Hủy 1 đơn nháp: DANG_LAP → DA_HUY (UPDATE có điều kiện, chạy 2 lần cũng chỉ giải phóng 1 lần),
 * giải phóng tạm giữ, ghi nhật ký. Trả về false nếu đơn không còn DANG_LAP (đã bị hủy/thanh toán).
 */
async function huyDonNhap(tx: Db, don: { maHD: number; maTK: number }, lyDo: string, chiHuyNeuTruoc?: Date) {
  const hoaDon = HoaDon.thamChieu(don.maHD, "DANG_LAP");
  if (!(await hoaDon.huyHoaDon(lyDo, tx, chiHuyNeuTruoc))) return false;
  const chiTiets = await hoaDon.layDanhSachChiTiet(tx);
  for (const c of chiTiets) await Sach.thamChieu(c.maSach).giaiPhong(c.soLuong, tx);
  await NhatKyHeThong.ghiNhatKy(
    { maTK: don.maTK, module: MODULE, hanhDong: "HUY_DON_DANG_LAP", noiDung: `Đơn nháp #${don.maHD} (${chiTiets.length} dòng) – ${lyDo}` },
    tx,
  );
  return true;
}

/**
 * Dọn dẹp lười (lazy cleanup): hủy mọi đơn DANG_LAP quá hạn. Gọi trước mỗi thao tác POS – không cần job nền.
 * Trả về các đơn vừa bị hủy.
 */
export async function huyDonQuaHan() {
  const { moc, dons: quaHan } = await HoaDon.timDonQuaHan(HAN_DON_NHAP_PHUT);
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
  return hoaDonRepository.donHuyGanDay(db, maTK, LY_DO_HUY.QUA_HAN, new Date(Date.now() - 10 * 60_000));
}
const thongBaoTuHuy = (d: { maHD: number; thoiGianCapNhat: Date }) =>
  `Đơn #${d.maHD} đã tự hủy lúc ${d.thoiGianCapNhat.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ` +
  `do quá ${HAN_DON_NHAP_PHUT} phút không cập nhật, sách đã trả về kho.`;


// ───────────── Hàm phụ ─────────────

function kiemTraMaConHieuLuc(ma: NonNullable<DonDangLap["maGiamGia"]>) {
  return new MaGiamGia(ma).lyDoKhongDung();
}

/** Tính tiền cho đơn đang lập; ném LoiTinhTien nếu mã/điểm không còn hợp lệ. */
function tinhTienDon(don: DonDangLap, { cauHinh, combos }: BoiCanh, ghiDe?: { maGiamGia?: DonDangLap["maGiamGia"]; diemSuDung?: number }): KetQuaTinhTien {
  const ma = ghiDe && "maGiamGia" in ghiDe ? ghiDe.maGiamGia : don.maGiamGia;
  const kh = don.khachHang;
  return new HoaDon(don).tinhTongTien({
    dong: don.chiTiets.map((c) => ({
      maSach: c.maSach, soLuong: c.soLuong, donGia: Number(c.donGiaBan),
      thanhTien: Number(c.thanhTien),
    })),
    combos,
    phanTramUuDaiHang: kh ? Number(kh.hangThanhVien.phanTramUuDai) : 0,
    maGiamGia: ma
      ? { loaiGiam: ma.loaiGiam as "PHAN_TRAM" | "SO_TIEN", giaTriGiam: Number(ma.giaTriGiam), giaTriDonToiThieu: Number(ma.giaTriDonToiThieu) }
      : null,
    diemSuDung: ghiDe?.diemSuDung,
    diemHienTai: kh?.diemHienTai ?? 0,
    giaTriMotDiem: Number(cauHinh.giaTriMotDiem),
    tyLeQuyDoiDiem: Number(cauHinh.tyLeQuyDoiDiem),
    coKhachHang: !!kh,
  });
}

async function layHoacTaoDon(db: Db, maTK: number) {
  const don = await hoaDonRepository.layDonDangLap(db, maTK);
  if (don) return don;
  await HoaDon.lapDonMoi(maTK, db);
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
      const sach = await Sach.timTheoMa(maSach, tx);
      if (!sach || sach.trangThai !== "DANG_BAN") throw new LoiPOS("Sách không tồn tại hoặc đã ngừng kinh doanh");
      const conBan = sach.soLuongKhaDung();
      if (!(await sach.tamGiu(soLuong, tx))) {
        throw new LoiPOS(`Vượt quá số lượng tồn: "${sach.tenSach}" chỉ còn ${conBan} cuốn có thể bán`);
      }
      const don = new HoaDon(await layHoacTaoDon(tx, maTK));
      await don.danhDauCapNhat(tx); // gia hạn thời gian tự hủy đơn nháp
      await don.themChiTiet(sach, soLuong, tx); // cộng dồn nếu đã có, chưa có thì thêm dòng với giá bán hiện tại
    });
  },

  /** Đặt số lượng mới cho 1 dòng (0 = xóa dòng). */
  async capNhatSoLuong(maTK: number, maSach: number, soLuongMoi: number) {
    if (!Number.isInteger(soLuongMoi) || soLuongMoi < 0) throw new LoiPOS("Số lượng không hợp lệ");
    await donDepTruocThaoTac(maTK);
    await prisma.$transaction(async (tx) => {
      const don = new HoaDon(await layDonBatBuoc(tx, maTK));
      await don.danhDauCapNhat(tx);
      const dongTho = await hoaDonRepository.layChiTiet(tx, don.maHD, maSach);
      if (!dongTho) throw new LoiPOS("Sách không có trong đơn");
      const dong = new ChiTietHoaDon(dongTho);
      const chenh = soLuongMoi - dong.soLuong;
      const sach = Sach.thamChieu(maSach);
      if (chenh > 0 && !(await sach.tamGiu(chenh, tx))) {
        const s = await Sach.timTheoMa(maSach, tx);
        throw new LoiPOS(`Vượt quá số lượng tồn – chỉ còn thêm được ${s ? s.soLuongKhaDung() : 0} cuốn`);
      }
      if (chenh < 0) await sach.giaiPhong(-chenh, tx);
      await dong.capNhatSoLuong(soLuongMoi, tx); // 0 = bỏ dòng khỏi đơn
    });
  },

  async chonKhachHang(maTK: number, soDienThoai: string) {
    await donDepTruocThaoTac(maTK);
    if (!SDT_HOP_LE.test(soDienThoai)) throw new LoiPOS("Số điện thoại gồm 10 chữ số, bắt đầu bằng 0");
    const kh = await KhachHang.timTheoSDT(soDienThoai);
    if (!kh) throw new KhongTimThayKhachHang(soDienThoai);
    await new HoaDon(await layHoacTaoDon(prisma, maTK)).ganKhachHang(kh.maKH);
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
      await new HoaDon(await layHoacTaoDon(tx, maTK)).ganKhachHang(kh.maKH, tx);
    });
  },

  async boKhachHang(maTK: number) {
    await donDepTruocThaoTac(maTK);
    await new HoaDon(await layDonBatBuoc(prisma, maTK)).ganKhachHang(null);
  },

  async apMaGiamGia(maTK: number, maCode: string) {
    await donDepTruocThaoTac(maTK);
    const [don, boiCanh] = await Promise.all([layDonBatBuoc(prisma, maTK), layBoiCanh()]);
    const ma = await MaGiamGia.timTheoMaCode(maCode);
    if (!ma) throw new LoiPOS(`Mã "${maCode}" không tồn tại`);
    const loi = ma.lyDoKhongDung();
    if (loi) throw new LoiPOS(loi);
    try {
      tinhTienDon(don, boiCanh, { maGiamGia: ma, diemSuDung: 0 }); // kiểm tra đơn tối thiểu
    } catch (e) {
      if (e instanceof LoiTinhTien) throw new LoiPOS(e.message);
      throw e;
    }
    // Đổi mã → bỏ điểm đã nhập (thứ tự áp: hạng → mã → điểm), nhân viên nhập lại điểm nếu cần
    await new HoaDon(don).apMaGiamGia(ma.maMGG);
  },

  async boMaGiamGia(maTK: number) {
    await donDepTruocThaoTac(maTK);
    await new HoaDon(await layDonBatBuoc(prisma, maTK)).apMaGiamGia(null);
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
    await new HoaDon(don).datDiemSuDung(diem);
  },

  /** Nhân viên bấm Hủy đơn: DA_HUY + giải phóng tạm giữ. */
  async huyDon(maTK: number) {
    await donDepTruocThaoTac(maTK);
    await prisma.$transaction(async (tx) => {
      // UC3.3 luồng 2a: chỉ hủy được đơn đang lập (chưa thanh toán)
      const don = await hoaDonRepository.layDonDangLap(tx, maTK);
      if (!don) throw new LoiPOS("Không thể hủy đơn hàng này: không có đơn đang lập (đơn đã thanh toán hoặc đã hủy).");
      await huyDonNhap(tx, don, LY_DO_HUY.NHAN_VIEN);
    });
  },

  /** Số sách trong đơn đang lập (để cảnh báo "Đơn hàng chưa hoàn tất" khi đăng xuất). */
  soSachDonDangLap: (maTK: number) => hoaDonRepository.soSachDonDangLap(maTK),

  /** Đăng xuất: hủy đơn nháp (nếu có) để giải phóng tạm giữ. */
  async huyDonKhiDangXuat(maTK: number) {
    await this.huyDonDangLapCua(maTK, LY_DO_HUY.DANG_XUAT);
  },

  /** Hủy đơn đang lập (nếu có) của một nhân viên – dùng khi đăng xuất / khi Admin khóa tài khoản. */
  async huyDonDangLapCua(maTK: number, lyDo: (typeof LY_DO_HUY)[keyof typeof LY_DO_HUY]) {
    const don = await hoaDonRepository.layDonDangLap(prisma, maTK);
    if (don) await prisma.$transaction((tx) => huyDonNhap(tx, don, lyDo));
    return !!don;
  },

  /** Thanh toán đơn đang lập. Trả về maHD để in hóa đơn. */
  async thanhToan(maTK: number, phuongThucTT: PhuongThucTT, tienKhachDua: number | null) {
    await donDepTruocThaoTac(maTK);
    return prisma.$transaction(async (tx) => {
      const [don, boiCanh] = await Promise.all([layDonBatBuoc(tx, maTK), layBoiCanh(tx)]);
      const { cauHinh } = boiCanh;
      if (don.chiTiets.length === 0) throw new LoiPOS("Đơn hàng chưa có sách");

      if (!new CauHinhHeThong(cauHinh).batPhuongThuc(phuongThucTT)) throw new LoiPOS("Phương thức thanh toán không được bật");

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
        if (tienKhachDua < tien.tongTien) throw new LoiPOS("Số tiền chưa đủ");
      }

      // Kho: trừ tồn + giải phóng tạm giữ
      for (const c of don.chiTiets) {
        if (!(await Sach.thamChieu(c.maSach).truTon(c.soLuong, tx, { daTamGiu: true }))) {
          throw new LoiPOS(`Không đủ tồn kho cho "${c.sach.tenSach}"`);
        }
      }

      if (don.maGiamGia && !(await new MaGiamGia(don.maGiamGia).tangLuotDung(tx))) {
        throw new LoiPOS("Mã giảm giá vừa hết lượt sử dụng. Hãy bỏ mã rồi thanh toán lại");
      }

      // Điểm khách hàng: trừ điểm đã dùng, cộng điểm mới, xét thăng hạng
      if (don.khachHang) {
        const kh = new KhachHang(don.khachHang);
        if (!(await kh.truDiem(don.diemSuDung, tx))) throw new LoiPOS("Khách không đủ điểm");
        await kh.congDiem(tien.diemCong, tx);
        // Chỉ thăng hạng, không hạ (hạ hạng chỉ xảy ra khi hủy hóa đơn)
        const hang = await HangThanhVien.xacDinhHang(kh.diemTichLuy, tx);
        if (hang && hang.diemToiThieu > don.khachHang.hangThanhVien.diemToiThieu) await kh.capNhatHang(hang, tx);
      }

      // Có điều kiện: nếu đơn vừa bị tự hủy ở request khác thì rollback toàn bộ
      const daThanhToan = await new HoaDon(don).capNhatTrangThai("DA_THANH_TOAN", tx, {
        thoiGianTao: new Date(), // = thời điểm thanh toán (dùng cho báo cáo doanh thu)
        tamTinh: tien.tamTinh, giamCombo: tien.giamCombo, giamHangThe: tien.giamHang, giamMaGiamGia: tien.giamMa,
        giamDiem: tien.giamDiem, thueVAT: tien.thueVAT, tongTien: tien.tongTien,
        phuongThucTT,
        tienKhachDua: phuongThucTT === "TIEN_MAT" ? tienKhachDua : tien.tongTien,
      });

      if (!daThanhToan) throw new LoiPOS("Đơn không còn ở trạng thái đang lập (có thể đã tự hủy). Hãy lập đơn mới.");

      await NhatKyHeThong.ghiNhatKy(
        { maTK, module: MODULE, hanhDong: "THANH_TOAN", noiDung: `HĐ #${don.maHD}, tổng ${tien.tongTien}đ, ${phuongThucTT}` },
        tx,
      );
      return don.maHD;
    });
  },
};
