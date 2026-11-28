// Lớp thực thể MaOTP – Bảng 3.39 (thuộc tính), Bảng 3.40 (phương thức).
import { randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/db";
import type { MaOTP as MaOTPModel } from "@/lib/generated/prisma/client";
import { maOTPRepository } from "@/lib/repositories/maOTPRepository";

export class MaOTP implements MaOTPModel {
  // ───── Thuộc tính ─────
  declare maOTP: number;
  declare maTK: number;
  declare maCode: string;
  declare thoiGianHetHan: Date;
  declare daSuDung: boolean;

  constructor(duLieu: MaOTPModel) {
    Object.assign(this, duLieu);
  }

  // ───── Phương thức ─────

  /** Còn hiệu lực: chưa dùng và chưa quá thời gian hết hạn. */
  conHieuLuc(): boolean {
    return !this.daSuDung && this.thoiGianHetHan.getTime() >= Date.now();
  }

  /** Khởi tạo mã OTP 6 số mới cho tài khoản (vô hiệu các mã cũ chưa dùng). */
  static async taoMa(maTK: number, hanPhut: number, db: Db = prisma): Promise<MaOTP> {
    const maCode = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await maOTPRepository.voHieuMaCu(db, maTK);
    return new MaOTP(await maOTPRepository.tao(db, maTK, maCode, new Date(Date.now() + hanPhut * 60_000)));
  }

  /** Mã OTP chưa dùng mới nhất của tài khoản. */
  static async layMaChuaDung(maTK: number, db: Db = prisma): Promise<MaOTP | null> {
    const d = await maOTPRepository.layMaChuaDung(db, maTK);
    return d && new MaOTP(d);
  }

  /** So khớp mã người dùng nhập (chỉ so, chưa đánh dấu đã dùng). */
  khop(maCode: string): boolean {
    return /^\d{6}$/.test(maCode) && maCode === this.maCode;
  }

  /** Đối chiếu mã và đánh dấu đã sử dụng nếu hợp lệ (UPDATE có điều kiện – mỗi mã chỉ dùng được 1 lần). */
  async xacThuc(maCode: string, db: Db = prisma): Promise<boolean> {
    if (!this.khop(maCode) || !this.conHieuLuc()) return false;
    return this.danhDauDaDung(db);
  }

  /** Đánh dấu đã sử dụng (cũng dùng để hủy mã khi nhập sai quá số lần). */
  async danhDauDaDung(db: Db = prisma): Promise<boolean> {
    const ok = await maOTPRepository.danhDauDaDung(db, this.maOTP);
    if (ok) this.daSuDung = true;
    return ok;
  }
}
