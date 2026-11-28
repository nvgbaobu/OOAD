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

  /** Cập nhật mốc điểm tối thiểu và % ưu đãi của hạng. */
  async capNhatMocHang(diem: number, uuDai: number, db: Db = prisma): Promise<void> {
    const d = await khachHangRepository.capNhatMocHang(db, this.maHang, diem, uuDai);
    Object.assign(this, d);
  }
}
