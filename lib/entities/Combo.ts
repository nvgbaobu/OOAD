// Lớp thực thể Combo (kế thừa KhuyenMai) – Bảng 3.57 (thuộc tính), Bảng 3.58 (phương thức).
import { Prisma } from "@/lib/generated/prisma/client";
import type { Combo as ComboModel, ChiTietCombo as ChiTietComboModel } from "@/lib/generated/prisma/client";
import { comboRepository } from "@/lib/repositories/comboRepository";
import { KhuyenMai } from "@/lib/entities/KhuyenMai";
import { ChiTietCombo } from "@/lib/entities/ChiTietCombo";
import type { Sach } from "@/lib/entities/Sach";

export class Combo extends KhuyenMai implements ComboModel {
  // ───── Thuộc tính (ngayBatDau, ngayKetThuc, trangThai kế thừa từ KhuyenMai) ─────
  declare maCombo: number;
  declare tenCombo: string;
  declare giaCombo: Prisma.Decimal;
  /** Các dòng sách trong combo. */
  declare chiTiets: ChiTietCombo[];

  constructor(duLieu: ComboModel & { chiTiets?: (ChiTietComboModel & { sach?: Pick<Sach, "maSach" | "giaBan"> })[] }) {
    super(duLieu);
    this.chiTiets = (duLieu.chiTiets ?? []).map((c) => new ChiTietCombo(c));
  }

  /** Combo mới (chưa lưu) – để thêm sách rồi kiểm tra giá trước khi lưu. */
  static moi(duLieu: Partial<ComboModel> = {}): Combo {
    return new Combo({ maCombo: 0, tenCombo: "", giaCombo: new Prisma.Decimal(0), ngayBatDau: new Date(), ngayKetThuc: new Date(), trangThai: "HOAT_DONG", ...duLieu });
  }

  // ───── Phương thức ─────

  /** Thêm đầu sách và số lượng vào combo. */
  themChiTiet(sach: Pick<Sach, "maSach" | "giaBan">, sl: number): void {
    this.chiTiets.push(new ChiTietCombo({ maCombo: this.maCombo, maSach: sach.maSach, soLuong: sl, sach }));
  }

  /** Tổng giá bán lẻ của các sách trong combo – giá combo phải thấp hơn số này mới có ưu đãi. */
  tinhTongGiaLe(): number {
    return this.chiTiets.reduce((t, c) => t + c.tinhGiaLe(), 0);
  }

  /** Tìm combo theo mã (kèm sách). */
  static async timTheoMa(maCombo: number): Promise<Combo | null> {
    const d = await comboRepository.timTheoMa(maCombo);
    return d && new Combo(d);
  }

  /** Ngừng / mở lại combo. */
  async doiTrangThai(hoatDong: boolean): Promise<void> {
    this.trangThai = hoatDong ? "HOAT_DONG" : "NGUNG_HOAT_DONG";
    await comboRepository.capNhatTrangThai(this.maCombo, this.trangThai);
  }

  /** Xóa combo (hóa đơn chỉ lưu số tiền giảm combo, không tham chiếu combo). */
  async xoa(): Promise<void> {
    await comboRepository.xoa(this.maCombo);
  }

  /** Lưu combo (thêm mới nếu maCombo = 0, ngược lại thay toàn bộ dòng sách). Trả về false nếu combo cần sửa không còn. */
  async luu(): Promise<boolean> {
    const { tenCombo, giaCombo, ngayBatDau, ngayKetThuc } = this;
    const dong = this.chiTiets.map((c) => ({ maSach: c.maSach, soLuong: c.soLuong }));
    const d = await comboRepository.luu(this.maCombo || null, { tenCombo, giaCombo, ngayBatDau, ngayKetThuc }, dong);
    if (!d) return false;
    this.maCombo = d.maCombo;
    return true;
  }
}
