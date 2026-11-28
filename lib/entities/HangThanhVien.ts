// Lớp thực thể HangThanhVien – Bảng 3.45 (thuộc tính), Bảng 3.46 (phương thức).
import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/db";
import type { Prisma, HangThanhVien as HangThanhVienModel } from "@/lib/generated/prisma/client";
import { khachHangRepository } from "@/lib/repositories/khachHangRepository";

export class HangThanhVien implements HangThanhVienModel {
  // ───── Thuộc tính ─────
  declare maHang: number;
  declare tenHang: string;
  declare diemToiThieu: number;
  declare phanTramUuDai: Prisma.Decimal;

  constructor(duLieu: HangThanhVienModel) {
    Object.assign(this, duLieu);
  }

  // ───── Phương thức ─────

  /** Danh sách hạng, mốc điểm tăng dần. */
  static async layDanhSach(db: Db = prisma): Promise<HangThanhVien[]> {
    return (await khachHangRepository.danhSachHang(db)).map((d) => new HangThanhVien(d));
  }

  /** Hạng tương ứng với điểm tích lũy = hạng có mốc cao nhất ≤ điểm. */
  static async xacDinhHang(diem: number, db: Db = prisma): Promise<HangThanhVien | null> {
    const d = await khachHangRepository.hangTheoDiem(db, diem);
    return d && new HangThanhVien(d);
  }

  /** Hạng thấp nhất (mốc 0 điểm) – gán cho khách mới. */
  static async hangThapNhat(db: Db = prisma): Promise<HangThanhVien | null> {
    const d = await khachHangRepository.hangThapNhat(db);
    return d && new HangThanhVien(d);
  }

  /** Tìm hạng theo mã. */
  static async timTheoMa(maHang: number, db: Db = prisma): Promise<HangThanhVien | null> {
    const d = await khachHangRepository.timHang(db, maHang);
    return d && new HangThanhVien(d);
  }

  /** Hạng mới (chưa lưu). */
  static moi(d: { tenHang: string; diemToiThieu: number; phanTramUuDai: number }): HangThanhVien {
    return Object.assign(Object.create(HangThanhVien.prototype) as HangThanhVien, { maHang: 0, ...d });
  }

  /** Là hạng của khách mới (mốc 0 điểm) – không đổi mốc, không xóa. */
  laHangKhachMoi(): boolean {
    return this.diemToiThieu === 0;
  }

  /** Cập nhật tên, mốc điểm tối thiểu và % ưu đãi của hạng. */
  async capNhatMocHang(d: { tenHang: string; diemToiThieu: number; phanTramUuDai: number }, db: Db = prisma): Promise<void> {
    Object.assign(this, await khachHangRepository.suaHang(db, this.maHang, d));
  }

  /** Lưu hạng mới vào CSDL. */
  async luu(db: Db = prisma): Promise<boolean> {
    const { tenHang, diemToiThieu, phanTramUuDai } = this;
    Object.assign(this, await khachHangRepository.taoHang(db, { tenHang, diemToiThieu, phanTramUuDai }));
    return true;
  }

  /** Xóa hạng (gọi sau khi đã chuyển khách sang hạng khác). */
  async xoa(db: Db = prisma): Promise<void> {
    await khachHangRepository.xoaHang(db, this.maHang);
  }
}
