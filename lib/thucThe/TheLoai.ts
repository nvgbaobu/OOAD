// Lớp thực thể TheLoai – Bảng 3.41 (thuộc tính), Bảng 3.42 (phương thức).
import type { TheLoai as TheLoaiModel } from "@/lib/generated/prisma/client";
import { theLoaiRepository } from "@/lib/repositories/theLoaiRepository";

export class TheLoai implements TheLoaiModel {
  // ───── Thuộc tính ─────
  declare maTL: number;
  declare tenTL: string;

  constructor(duLieu: TheLoaiModel) {
    Object.assign(this, duLieu);
  }

  // ───── Phương thức ─────

  /** Danh sách toàn bộ thể loại (hiển thị, lọc sách, chọn khi thêm sách). */
  static async layDanhSach(): Promise<TheLoai[]> {
    return (await theLoaiRepository.tatCa()).map((d) => new TheLoai(d));
  }

  /** Tìm thể loại theo mã. */
  static async timTheoMa(maTL: number): Promise<TheLoai | null> {
    const d = await theLoaiRepository.timTheoMa(maTL);
    return d && new TheLoai(d);
  }
}
