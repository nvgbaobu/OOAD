// Lớp thực thể ChiTietCombo – Bảng 3.59 (thuộc tính), Bảng 3.60 (phương thức).
import type { ChiTietCombo as ChiTietComboModel } from "@/lib/generated/prisma/client";
import type { Sach } from "@/lib/thucThe/Sach";

export class ChiTietCombo implements ChiTietComboModel {
  // ───── Thuộc tính ─────
  declare maCombo: number;
  declare maSach: number;
  declare soLuong: number;
  /** Sách của dòng (cần giá bán để tính giá lẻ). */
  declare sach?: Pick<Sach, "maSach" | "giaBan">;

  constructor(duLieu: ChiTietComboModel & { sach?: Pick<Sach, "maSach" | "giaBan"> }) {
    Object.assign(this, duLieu);
  }

  // ───── Phương thức ─────

  /** Giá bán lẻ của dòng = số lượng × giá bán hiện tại của sách. */
  tinhGiaLe(): number {
    return Number(this.sach?.giaBan ?? 0) * this.soLuong;
  }
}
