// Lớp thực thể TaiKhoan – Bảng 3.37 (thuộc tính), Bảng 3.38 (phương thức).
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/db";
import type { TaiKhoan as TaiKhoanModel } from "@/lib/generated/prisma/client";
import { taiKhoanRepository } from "@/lib/repositories/taiKhoanRepository";

export class TaiKhoan implements TaiKhoanModel {
  // ───── Thuộc tính ─────
  declare maTK: number;
  declare soDienThoai: string;
  declare matKhauHash: string;
  declare hoTen: string;
  declare email: string | null;
  declare vaiTro: string; // ADMIN | STAFF
  declare trangThai: string; // HOAT_DONG | KHOA
  declare ngayTao: Date;

  constructor(duLieu: TaiKhoanModel) {
    Object.assign(this, duLieu);
  }

  // ───── Phương thức ─────

  /** Kiểm tra mật khẩu nhập vào có khớp với mật khẩu đã mã hóa (bcrypt) không. */
  kiemTraMatKhau(mk: string): Promise<boolean> {
    return bcrypt.compare(mk, this.matKhauHash);
  }

  /** Mã hóa mật khẩu (bcrypt, 10 vòng). */
  static maHoaMatKhau(mk: string): Promise<string> {
    return bcrypt.hash(mk, 10);
  }

  /** Tài khoản mới (chưa lưu), đang hoạt động. */
  static async moi(d: Pick<TaiKhoanModel, "soDienThoai" | "hoTen" | "email" | "vaiTro">, matKhau: string): Promise<TaiKhoan> {
    return new TaiKhoan({ maTK: 0, ...d, matKhauHash: await TaiKhoan.maHoaMatKhau(matKhau), trangThai: "HOAT_DONG", ngayTao: new Date() });
  }

  /** Đổi mật khẩu mới (mã hóa bcrypt trước khi lưu). */
  async doiMatKhau(moi: string, db: Db = prisma): Promise<void> {
    this.matKhauHash = await TaiKhoan.maHoaMatKhau(moi);
    await taiKhoanRepository.capNhatMatKhau(db, this.maTK, this.matKhauHash);
  }

  /** Khóa tài khoản. */
  async khoa(): Promise<void> {
    await taiKhoanRepository.capNhat(this.maTK, { trangThai: "KHOA" });
    this.trangThai = "KHOA";
  }

  /** Mở khóa tài khoản. */
  async moKhoa(): Promise<void> {
    await taiKhoanRepository.capNhat(this.maTK, { trangThai: "HOAT_DONG" });
    this.trangThai = "HOAT_DONG";
  }

  /** Tìm tài khoản theo số điện thoại đăng nhập. */
  static async timTheoSDT(sdt: string): Promise<TaiKhoan | null> {
    const d = await taiKhoanRepository.timTheoSoDienThoai(sdt);
    return d && new TaiKhoan(d);
  }

  /** Tìm tài khoản theo mã. */
  static async timTheoMa(maTK: number): Promise<TaiKhoan | null> {
    const d = await taiKhoanRepository.timTheoMa(maTK);
    return d && new TaiKhoan(d);
  }

  /** Lưu tài khoản: thêm mới nếu maTK = 0, ngược lại cập nhật họ tên, email, vai trò, trạng thái (SĐT không đổi). */
  async luu(): Promise<boolean> {
    const { hoTen, email, vaiTro, trangThai } = this;
    if (this.maTK) await taiKhoanRepository.capNhat(this.maTK, { hoTen, email, vaiTro, trangThai });
    else {
      const d = await taiKhoanRepository.tao({ soDienThoai: this.soDienThoai, hoTen, email, vaiTro, trangThai, matKhauHash: this.matKhauHash });
      Object.assign(this, { maTK: d.maTK, ngayTao: d.ngayTao });
    }
    return true;
  }

  /** Thông tin công khai (không có mật khẩu đã mã hóa) – để trả ra ngoài service. */
  thongTinCongKhai(): Omit<TaiKhoanModel, "matKhauHash"> {
    const { maTK, soDienThoai, hoTen, email, vaiTro, trangThai, ngayTao } = this;
    return { maTK, soDienThoai, hoTen, email, vaiTro, trangThai, ngayTao };
  }

  /** Số Admin đang hoạt động (luôn phải còn ít nhất 1). */
  static soAdminHoatDong(): Promise<number> {
    return taiKhoanRepository.demAdminHoatDong();
  }
}
