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

  /** Đổi mật khẩu mới (mã hóa bcrypt trước khi lưu). */
  async doiMatKhau(moi: string, db: Db = prisma): Promise<void> {
    this.matKhauHash = await bcrypt.hash(moi, 10);
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

  /** Lưu thông tin tài khoản (họ tên, email, vai trò, trạng thái) vào CSDL. */
  async luu(): Promise<boolean> {
    await taiKhoanRepository.capNhat(this.maTK, { hoTen: this.hoTen, email: this.email, vaiTro: this.vaiTro, trangThai: this.trangThai });
    return true;
  }
}
