// Lớp thực thể KhachHang – Bảng 3.47 (thuộc tính), Bảng 3.48 (phương thức).
// Điểm chỉ đổi qua các phương thức dưới đây (gọi từ thanh toán / hủy hóa đơn), không sửa tay.
import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/db";
import type { KhachHang as KhachHangModel } from "@/lib/generated/prisma/client";
import { khachHangRepository, type LocKhachHang } from "@/lib/repositories/khachHangRepository";
import type { HangThanhVien } from "@/lib/entities/HangThanhVien";

export class KhachHang implements KhachHangModel {
  // ───── Thuộc tính ─────
  declare maKH: number;
  declare soDienThoai: string;
  declare hoTen: string;
  declare email: string | null;
  declare diaChi: string | null;
  declare diemHienTai: number; // điểm còn lại để đổi
  declare diemTichLuy: number; // tổng điểm từng được cộng – dùng xét hạng
  declare maHang: number;
  declare ngayTao: Date;

  constructor(duLieu: KhachHangModel) {
    Object.assign(this, duLieu);
  }

  // ───── Phương thức ─────

  /** Cộng điểm thưởng sau thanh toán (cộng cả điểm hiện tại và điểm tích lũy). */
  async congDiem(diem: number, db: Db = prisma): Promise<void> {
    if (diem <= 0) return;
    await khachHangRepository.congDiem(db, this.maKH, diem);
    this.diemHienTai += diem;
    this.diemTichLuy += diem;
  }

  /** Trừ điểm khách dùng để đổi. Trả về false nếu khách không đủ điểm. */
  async truDiem(diem: number, db: Db = prisma): Promise<boolean> {
    if (diem <= 0) return true;
    const ok = await khachHangRepository.truDiem(db, this.maKH, diem);
    if (ok) this.diemHienTai -= diem;
    return ok;
  }

  /**
   * Hủy hóa đơn: hoàn số điểm đã dùng, trừ số điểm đã được cộng (về 0 nếu khách đã tiêu bớt).
   * Trả về số điểm bị trừ hụt.
   */
  async hoanDiem(diemSuDung: number, diemCong: number, db: Db = prisma): Promise<number> {
    const thieu = await khachHangRepository.hoanDiemKhiHuy(db, this.maKH, diemSuDung, diemCong);
    this.diemHienTai = Math.max(0, this.diemHienTai + diemSuDung - diemCong);
    this.diemTichLuy = Math.max(0, this.diemTichLuy - diemCong);
    return thieu;
  }

  /** Chuyển khách sang hạng mới (thăng hạng sau thanh toán / hạ hạng khi hủy hóa đơn). */
  async capNhatHang(hang: HangThanhVien, db: Db = prisma): Promise<void> {
    await khachHangRepository.capNhatHang(db, this.maKH, hang.maHang);
    this.maHang = hang.maHang;
  }

  /** Cập nhật thông tin liên hệ (SĐT, họ tên, email, địa chỉ) – điểm không sửa tay. */
  async capNhatThongTin(d: Pick<KhachHangModel, "soDienThoai" | "hoTen" | "email" | "diaChi">, db: Db = prisma): Promise<void> {
    Object.assign(this, await khachHangRepository.capNhat(db, this.maKH, d));
  }

  /** Số hóa đơn của khách (kể cả đơn nháp) – khách đã có hóa đơn thì không xóa được. */
  soHoaDon(): Promise<number> {
    return khachHangRepository.demHoaDon(this.maKH);
  }

  /** Xóa khách hàng khỏi CSDL. */
  async xoa(db: Db = prisma): Promise<void> {
    await khachHangRepository.xoa(db, this.maKH);
  }

  /** Tìm khách theo mã. */
  static async timTheoMa(maKH: number, db: Db = prisma): Promise<KhachHang | null> {
    const d = await khachHangRepository.timTheoMa(db, maKH);
    return d && new KhachHang(d);
  }

  /** Khách mới (chưa lưu): 0 điểm, hạng của khách mới. */
  static moi(d: Pick<KhachHangModel, "soDienThoai" | "hoTen" | "email" | "diaChi">, hang: HangThanhVien): KhachHang {
    return new KhachHang({ maKH: 0, ...d, diemHienTai: 0, diemTichLuy: 0, maHang: hang.maHang, ngayTao: new Date() });
  }

  /**
   * Xét lại hạng toàn bộ khách theo điểm tích lũy (sau khi thêm/sửa/xóa hạng; có thể hạ hạng).
   * boQuaHang: hạng sắp xóa – không xếp khách vào. Trả về số khách đổi hạng.
   */
  static xetLaiHangToanBo(db: Db = prisma, boQuaHang = 0): Promise<number> {
    return khachHangRepository.xetLaiHang(db, boQuaHang);
  }

  /** Tra cứu khách theo số điện thoại. */
  static async timTheoSDT(sdt: string, db: Db = prisma): Promise<KhachHang | null> {
    const d = await khachHangRepository.timTheoSoDienThoai(db, sdt);
    return d && new KhachHang(d);
  }

  /** Danh sách khách hàng theo bộ lọc. */
  static async layDanhSach(loc: LocKhachHang, boQua: number, lay: number): Promise<KhachHang[]> {
    return (await khachHangRepository.danhSach(loc, boQua, lay)).map((d) => new KhachHang(d));
  }

  /** Lưu khách hàng mới vào CSDL (khách hàng có sẵn: cập nhật qua khachHangService.capNhat). */
  async luu(db: Db = prisma): Promise<boolean> {
    const { soDienThoai, hoTen, email, diaChi, maHang } = this;
    Object.assign(this, await khachHangRepository.tao(db, { soDienThoai, hoTen, email, diaChi, maHang, diemHienTai: 0, diemTichLuy: 0 }));
    return true;
  }
}
