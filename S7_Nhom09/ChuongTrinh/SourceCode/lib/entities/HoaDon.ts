// Lớp thực thể HoaDon – Bảng 3.49 (thuộc tính), Bảng 3.50 (phương thức).
// Vòng đời: DANG_LAP (giỏ hàng POS) → DA_THANH_TOAN → (Admin hủy) DA_HUY;  DANG_LAP → DA_HUY (hủy đơn nháp).
import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/db";
import type { Prisma, HoaDon as HoaDonModel } from "@/lib/generated/prisma/client";
import { hoaDonRepository, type LocHoaDon } from "@/lib/repositories/hoaDonRepository";
import { tinhTienHoaDon, tinhDiemCong, type DauVaoTinhTien, type KetQuaTinhTien } from "@/lib/services/tinhTienHoaDon";
import { ChiTietHoaDon } from "@/lib/entities/ChiTietHoaDon";
import type { Sach } from "@/lib/entities/Sach";

export type TrangThaiHoaDon = "DANG_LAP" | "DA_THANH_TOAN" | "DA_HUY";

/** Các lần chuyển trạng thái hợp lệ – không thể đưa hóa đơn đã hủy về lại, hay thanh toán hóa đơn đã thanh toán. */
const CHUYEN_HOP_LE: Record<string, TrangThaiHoaDon[]> = {
  DANG_LAP: ["DA_THANH_TOAN", "DA_HUY"],
  DA_THANH_TOAN: ["DA_HUY"],
  DA_HUY: [],
};

export class HoaDon implements HoaDonModel {
  // ───── Thuộc tính ─────
  declare maHD: number;
  declare maTK: number; // nhân viên lập
  declare maKH: number | null;
  declare maMGG: number | null;
  declare thoiGianTao: Date; // = thời điểm thanh toán
  declare thoiGianCapNhat: Date;
  declare trangThai: string; // DANG_LAP | DA_THANH_TOAN | DA_HUY
  declare tamTinh: Prisma.Decimal;
  declare giamCombo: Prisma.Decimal;
  declare giamHangThe: Prisma.Decimal;
  declare giamMaGiamGia: Prisma.Decimal;
  declare giamDiem: Prisma.Decimal;
  declare thueVAT: Prisma.Decimal;
  declare diemSuDung: number;
  declare tongTien: Prisma.Decimal;
  declare phuongThucTT: string | null; // TIEN_MAT | QUET_THE | MA_QR; NULL khi đang lập
  declare tienKhachDua: Prisma.Decimal | null;
  declare lyDoHuy: string | null;

  constructor(duLieu: HoaDonModel) {
    Object.assign(this, duLieu);
  }

  /** Đối tượng chỉ biết mã + trạng thái hiện tại – đủ để chuyển trạng thái có điều kiện mà không đọc cả hóa đơn. */
  static thamChieu(maHD: number, trangThai: TrangThaiHoaDon): HoaDon {
    return Object.assign(Object.create(HoaDon.prototype) as HoaDon, { maHD, trangThai });
  }

  /** Lập đơn mới (giỏ hàng POS) cho nhân viên – trạng thái Đang lập. */
  static async lapDonMoi(maTK: number, db: Db = prisma): Promise<HoaDon> {
    return new HoaDon(await hoaDonRepository.taoDonDangLap(db, maTK));
  }

  // ───── Phương thức ─────

  /** Đánh dấu đơn vừa được sửa (gia hạn thời gian tự hủy đơn nháp). */
  async danhDauCapNhat(db: Db = prisma): Promise<void> {
    this.thoiGianCapNhat = (await hoaDonRepository.capNhatDon(db, this.maHD)).thoiGianCapNhat;
  }

  /** Gắn (hoặc bỏ, khi null) khách thành viên cho đơn đang lập; điểm đã nhập bị đặt lại 0. */
  async ganKhachHang(maKH: number | null, db: Db = prisma): Promise<void> {
    await hoaDonRepository.capNhatDon(db, this.maHD, { maKH, diemSuDung: 0 });
    Object.assign(this, { maKH, diemSuDung: 0 });
  }

  /** Áp (hoặc bỏ, khi null) mã giảm giá. Đổi mã → điểm đã nhập đặt lại 0 (thứ tự áp: hạng → mã → điểm). */
  async apMaGiamGia(maMGG: number | null, db: Db = prisma): Promise<void> {
    const data = maMGG === null ? { maMGG } : { maMGG, diemSuDung: 0 };
    await hoaDonRepository.capNhatDon(db, this.maHD, data);
    Object.assign(this, data);
  }

  /** Đặt số điểm khách muốn đổi cho đơn đang lập. */
  async datDiemSuDung(diem: number, db: Db = prisma): Promise<void> {
    await hoaDonRepository.capNhatDon(db, this.maHD, { diemSuDung: diem });
    this.diemSuDung = diem;
  }

  /**
   * Thêm sách vào đơn đang lập: sách đã có trong đơn thì cộng dồn số lượng, chưa có thì thêm dòng mới
   * với đơn giá = giá bán hiện tại (snapshot). Việc tạm giữ kho do Sach.tamGiu() đảm nhận.
   */
  async themChiTiet(sach: Sach, sl: number, db: Db = prisma): Promise<void> {
    const dong = await hoaDonRepository.layChiTiet(db, this.maHD, sach.maSach);
    if (dong) {
      const ct = new ChiTietHoaDon(dong);
      await ct.capNhatSoLuong(ct.soLuong + sl, db);
    } else {
      await hoaDonRepository.taoChiTiet(db, {
        maHD: this.maHD, maSach: sach.maSach, soLuong: sl, donGiaBan: sach.giaBan, thanhTien: Number(sach.giaBan) * sl,
      });
    }
  }

  /**
   * Tính tiền theo thứ tự: tạm tính → combo → ưu đãi hạng → mã giảm giá → đổi điểm → + VAT.
   * Cài đặt thuật toán duy nhất ở lib/services/tinhTienHoaDon.ts (dùng chung với seed).
   */
  tinhTongTien(v: Omit<DauVaoTinhTien, "diemSuDung"> & { diemSuDung?: number }): KetQuaTinhTien {
    return tinhTienHoaDon({ ...v, diemSuDung: v.diemSuDung ?? this.diemSuDung });
  }

  /** Tiền thối lại = tiền khách đưa − tổng tiền (thanh toán không dùng tiền mặt → 0). */
  tienThoiLai(): number {
    return this.tienKhachDua ? Number(this.tienKhachDua) - Number(this.tongTien) : 0;
  }

  /** Điểm thưởng của hóa đơn = ⌊tổng tiền / tỷ lệ quy đổi⌋. */
  tinhDiemCong(tyLe: number): number {
    return tinhDiemCong(Number(this.tongTien), tyLe);
  }

  /**
   * Chuyển trạng thái (UPDATE có điều kiện: chỉ khi hóa đơn trong CSDL vẫn đang ở trạng thái hiện tại của đối tượng).
   * Trả về false nếu chuyển không hợp lệ hoặc request khác đã đổi trạng thái trước.
   */
  async capNhatTrangThai(
    tt: TrangThaiHoaDon, db: Db = prisma,
    duLieu: Omit<Prisma.HoaDonUncheckedUpdateManyInput, "trangThai"> = {}, chiKhiCapNhatTruoc?: Date,
  ): Promise<boolean> {
    if (!CHUYEN_HOP_LE[this.trangThai]?.includes(tt)) return false;
    const ok = await hoaDonRepository.chuyenTrangThai(db, this.maHD, this.trangThai, tt, duLieu, chiKhiCapNhatTruoc);
    if (ok) this.trangThai = tt;
    return ok;
  }

  /**
   * Chuyển sang Đã hủy và lưu lý do (hủy đơn nháp tại POS, hoặc Admin hủy hóa đơn đã thanh toán).
   * Hoàn kho / hoàn điểm / hoàn lượt mã do service điều phối trong cùng transaction.
   */
  async huyHoaDon(lyDo: string, db: Db = prisma, chiKhiCapNhatTruoc?: Date): Promise<boolean> {
    const ok = await this.capNhatTrangThai("DA_HUY", db, { lyDoHuy: lyDo }, chiKhiCapNhatTruoc);
    if (ok) this.lyDoHuy = lyDo;
    return ok;
  }

  /** Danh sách chi tiết (từng cuốn sách) của hóa đơn. */
  async layDanhSachChiTiet(db: Db = prisma): Promise<ChiTietHoaDon[]> {
    return (await hoaDonRepository.layDanhSachChiTiet(db, this.maHD)).map((d) => new ChiTietHoaDon(d));
  }

  /** Tra cứu hóa đơn theo ngày, khách hàng, mã hóa đơn, trạng thái... */
  static async timTheoDieuKien(dk: LocHoaDon, boQua: number, lay: number): Promise<HoaDon[]> {
    return (await hoaDonRepository.danhSach(dk, boQua, lay)).map((d) => new HoaDon(d));
  }

  /** Tìm hóa đơn theo mã. */
  static async timTheoMa(maHD: number, db: Db = prisma): Promise<HoaDon | null> {
    const d = await hoaDonRepository.timTheoMa(db, maHD);
    return d && new HoaDon(d);
  }

  /** Các đơn đang lập không được cập nhật quá `phut` phút (để tự hủy – UC3.3). */
  static async timDonQuaHan(phut: number, db: Db = prisma) {
    const moc = new Date(Date.now() - phut * 60_000);
    return { moc, dons: await hoaDonRepository.donQuaHan(db, moc) };
  }
}
