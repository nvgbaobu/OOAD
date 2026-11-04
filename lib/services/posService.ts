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
import { nhatKyRepository } from "@/lib/repositories/nhatKyRepository";
import { tinhTienHoaDon, LoiTinhTien, type KetQuaTinhTien } from "@/lib/services/tinhTienHoaDon";

/** Lỗi nghiệp vụ – thông điệp hiển thị thẳng cho người dùng. */
export class LoiPOS extends Error {}

export type PhuongThucTT = "TIEN_MAT" | "QUET_THE" | "MA_QR";
export const TEN_PHUONG_THUC: Record<PhuongThucTT, string> = { TIEN_MAT: "Tiền mặt", QUET_THE: "Quẹt thẻ", MA_QR: "Mã QR" };

type DonDangLap = NonNullable<Awaited<ReturnType<typeof hoaDonRepository.layDonDangLap>>>;
type CauHinh = Awaited<ReturnType<typeof cauHinhRepository.lay>>;

const MODULE = "BAN_HANG";

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
function tinhTienDon(don: DonDangLap, cauHinh: CauHinh, ghiDe?: { maGiamGia?: DonDangLap["maGiamGia"]; diemSuDung?: number }): KetQuaTinhTien {
  const ma = ghiDe && "maGiamGia" in ghiDe ? ghiDe.maGiamGia : don.maGiamGia;
  const kh = don.khachHang;
  return tinhTienHoaDon({
    dong: don.chiTiets.map((c) => ({ thanhTien: Number(c.thanhTien), thueSuatVAT: Number(c.thueSuatVAT) })),
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
  if (!don) throw new LoiPOS("Chưa có đơn đang lập");
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
    const [don, cauHinh] = await Promise.all([hoaDonRepository.layDonDangLap(prisma, maTK), cauHinhRepository.lay()]);
    const phuongThuc = (Object.keys(TEN_PHUONG_THUC) as PhuongThucTT[]).filter(
      (p) => ({ TIEN_MAT: cauHinh.ttTienMat, QUET_THE: cauHinh.ttQuetThe, MA_QR: cauHinh.ttMaQR })[p],
    );
    if (!don) return { don: null, tien: null, canhBao: null, phuongThuc, giaTriMotDiem: Number(cauHinh.giaTriMotDiem) };

    let canhBao: string | null = null;
    let tien: KetQuaTinhTien;
    try {
      tien = tinhTienDon(don, cauHinh);
    } catch (e) {
      if (!(e instanceof LoiTinhTien)) throw e;
      // Vd: bớt sách làm đơn không còn đạt mức tối thiểu của mã → hiển thị cảnh báo, tạm tính không mã/điểm
      canhBao = e.message;
      tien = tinhTienDon(don, cauHinh, { maGiamGia: null, diemSuDung: 0 });
    }
    return { don, tien, canhBao, phuongThuc, giaTriMotDiem: Number(cauHinh.giaTriMotDiem) };
  },

  async themSach(maTK: number, maSach: number, soLuong = 1) {
    if (!Number.isInteger(soLuong) || soLuong <= 0) throw new LoiPOS("Số lượng không hợp lệ");
    await prisma.$transaction(async (tx) => {
      const sach = await sachRepository.timTheoMa(tx, maSach);
      if (!sach || sach.trangThai !== "DANG_BAN") throw new LoiPOS("Sách không tồn tại hoặc đã ngừng kinh doanh");
      if (!(await sachRepository.tangTamGiu(tx, maSach, soLuong))) {
        throw new LoiPOS(`"${sach.tenSach}" chỉ còn ${sach.soLuongTon - sach.soLuongTamGiu} cuốn có thể bán`);
      }
      const don = await layHoacTaoDon(tx, maTK);
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
    await prisma.$transaction(async (tx) => {
      const don = await layDonBatBuoc(tx, maTK);
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
    const kh = await khachHangRepository.timTheoSoDienThoai(prisma, soDienThoai);
    if (!kh) throw new LoiPOS(`Không tìm thấy khách hàng có SĐT ${soDienThoai}`);
    const don = await layHoacTaoDon(prisma, maTK);
    await prisma.hoaDon.update({ where: { maHD: don.maHD }, data: { maKH: kh.maKH, diemSuDung: 0 } });
  },

  async boKhachHang(maTK: number) {
    const don = await layDonBatBuoc(prisma, maTK);
    await prisma.hoaDon.update({ where: { maHD: don.maHD }, data: { maKH: null, diemSuDung: 0 } });
  },

  async apMaGiamGia(maTK: number, maCode: string) {
    const [don, cauHinh] = await Promise.all([layDonBatBuoc(prisma, maTK), cauHinhRepository.lay()]);
    const ma = await maGiamGiaRepository.timTheoCode(prisma, maCode);
    if (!ma) throw new LoiPOS(`Mã "${maCode}" không tồn tại`);
    const loi = kiemTraMaConHieuLuc(ma);
    if (loi) throw new LoiPOS(loi);
    try {
      tinhTienDon(don, cauHinh, { maGiamGia: ma, diemSuDung: 0 }); // kiểm tra đơn tối thiểu
    } catch (e) {
      if (e instanceof LoiTinhTien) throw new LoiPOS(e.message);
      throw e;
    }
    // Đổi mã → bỏ điểm đã nhập (thứ tự áp: hạng → mã → điểm), nhân viên nhập lại điểm nếu cần
    await prisma.hoaDon.update({ where: { maHD: don.maHD }, data: { maMGG: ma.maMGG, diemSuDung: 0 } });
  },

  async boMaGiamGia(maTK: number) {
    const don = await layDonBatBuoc(prisma, maTK);
    await prisma.hoaDon.update({ where: { maHD: don.maHD }, data: { maMGG: null } });
  },

  async datDiemSuDung(maTK: number, diem: number) {
    if (!Number.isInteger(diem) || diem < 0) throw new LoiPOS("Số điểm không hợp lệ");
    const [don, cauHinh] = await Promise.all([layDonBatBuoc(prisma, maTK), cauHinhRepository.lay()]);
    if (!don.khachHang) throw new LoiPOS("Chọn khách hàng thành viên trước khi đổi điểm");
    try {
      tinhTienDon(don, cauHinh, { diemSuDung: diem });
    } catch (e) {
      if (e instanceof LoiTinhTien) throw new LoiPOS(e.message);
      throw e;
    }
    await prisma.hoaDon.update({ where: { maHD: don.maHD }, data: { diemSuDung: diem } });
  },

  /** Hủy đơn đang lập: giải phóng tạm giữ và xóa đơn nháp. */
  async huyDon(maTK: number) {
    await prisma.$transaction(async (tx) => {
      const don = await layDonBatBuoc(tx, maTK);
      for (const c of don.chiTiets) await sachRepository.giamTamGiu(tx, c.maSach, c.soLuong);
      await tx.hoaDon.delete({ where: { maHD: don.maHD } });
      await nhatKyRepository.ghi(
        { maTK, module: MODULE, hanhDong: "HUY_DON_DANG_LAP", noiDung: `Đơn nháp #${don.maHD}, ${don.chiTiets.length} dòng` },
        tx,
      );
    });
  },

  /** Thanh toán đơn đang lập. Trả về maHD để in hóa đơn. */
  async thanhToan(maTK: number, phuongThucTT: PhuongThucTT, tienKhachDua: number | null) {
    return prisma.$transaction(async (tx) => {
      const [don, cauHinh] = await Promise.all([layDonBatBuoc(tx, maTK), cauHinhRepository.lay(tx)]);
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
        tien = tinhTienDon(don, cauHinh);
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

      await tx.hoaDon.update({
        where: { maHD: don.maHD },
        data: {
          trangThai: "DA_THANH_TOAN",
          thoiGianTao: new Date(), // = thời điểm thanh toán (dùng cho báo cáo doanh thu)
          tamTinh: tien.tamTinh, thueVAT: tien.thueVAT, tienGiam: tien.tienGiam, tongTien: tien.tongTien,
          diemCong: tien.diemCong, phuongThucTT,
          tienKhachDua: phuongThucTT === "TIEN_MAT" ? tienKhachDua : tien.tongTien,
        },
      });

      await nhatKyRepository.ghi(
        { maTK, module: MODULE, hanhDong: "THANH_TOAN", noiDung: `HĐ #${don.maHD}, tổng ${tien.tongTien}đ, ${phuongThucTT}` },
        tx,
      );
      return don.maHD;
    });
  },
};
