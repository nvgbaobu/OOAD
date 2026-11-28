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

  /** Tìm thể loại theo tên (không phân biệt hoa/thường theo collation SQL Server). */
  static async timTheoTen(tenTL: string): Promise<TheLoai | null> {
    const d = await theLoaiRepository.timTheoTen(tenTL);
    return d && new TheLoai(d);
  }

  /** Thể loại mới (chưa lưu). */
  static moi(tenTL: string): TheLoai {
    return new TheLoai({ maTL: 0, tenTL });
  }

  /** Lưu: thêm mới nếu maTL = 0, ngược lại đổi tên. */
  async luu(): Promise<boolean> {
    Object.assign(this, this.maTL ? await theLoaiRepository.capNhat(this.maTL, this.tenTL) : await theLoaiRepository.tao(this.tenTL));
    return true;
  }

  /** Số sách thuộc thể loại – chỉ xóa được thể loại chưa có sách. */
  soSach(): Promise<number> {
    return theLoaiRepository.demSach(this.maTL);
  }

  /** Xóa thể loại. */
  async xoa(): Promise<void> {
    await theLoaiRepository.xoa(this.maTL);
  }

  /** Tìm thể loại theo mã. */
  static async timTheoMa(maTL: number): Promise<TheLoai | null> {
    const d = await theLoaiRepository.timTheoMa(maTL);
    return d && new TheLoai(d);
  }
}
