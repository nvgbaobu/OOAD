// Lớp thực thể MaGiamGia (kế thừa KhuyenMai) – Bảng 3.55 (thuộc tính), Bảng 3.56 (phương thức).
import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/db";
import type { Prisma, MaGiamGia as MaGiamGiaModel } from "@/lib/generated/prisma/client";
import { maGiamGiaRepository } from "@/lib/repositories/maGiamGiaRepository";
import { tinhGiamMa } from "@/lib/services/tinhTienHoaDon";
import { KhuyenMai } from "@/lib/entities/KhuyenMai";

export class MaGiamGia extends KhuyenMai implements MaGiamGiaModel {
  // ───── Thuộc tính (ngayBatDau, ngayKetThuc, trangThai kế thừa từ KhuyenMai) ─────
  declare maMGG: number;
  declare maCode: string;
  declare loaiGiam: string; // PHAN_TRAM | SO_TIEN
  declare giaTriGiam: Prisma.Decimal;
  declare giaTriDonToiThieu: Prisma.Decimal;
  declare soLuongToiDa: number;
  declare daSuDung: number;

  constructor(duLieu: MaGiamGiaModel) {
    super(duLieu);
  }

  // ───── Phương thức ─────

  /** Tìm mã theo khóa chính. */
  static async timTheoMa(maMGG: number): Promise<MaGiamGia | null> {
    const d = await maGiamGiaRepository.timTheoMa(maMGG);
    return d && new MaGiamGia(d);
  }

  /** Mã mới (chưa lưu): đang hoạt động, chưa dùng lượt nào. */
  static moi(d: Pick<MaGiamGiaModel, "maCode" | "loaiGiam" | "soLuongToiDa" | "ngayBatDau" | "ngayKetThuc"> & { giaTriGiam: number; giaTriDonToiThieu: number }): MaGiamGia {
    return Object.assign(Object.create(MaGiamGia.prototype) as MaGiamGia, { maMGG: 0, ...d, daSuDung: 0, trangThai: "HOAT_DONG" });
  }

  /** Đã được dùng (có lượt hoặc đã gắn vào hóa đơn, kể cả đơn nháp) → không đổi mã code, không xóa. */
  async daDung(): Promise<boolean> {
    return this.daSuDung > 0 || (await maGiamGiaRepository.demHoaDon(this.maMGG)) > 0;
  }

  /** Ngừng / mở lại mã. */
  async doiTrangThai(hoatDong: boolean): Promise<void> {
    this.trangThai = hoatDong ? "HOAT_DONG" : "NGUNG_HOAT_DONG";
    await maGiamGiaRepository.capNhat(this.maMGG, { trangThai: this.trangThai });
  }

  /** Xóa mã (chỉ khi chưa dùng – service kiểm tra). */
  async xoa(): Promise<void> {
    await maGiamGiaRepository.xoa(this.maMGG);
  }

  /** Tìm mã theo chuỗi nhân viên nhập tại quầy (không phân biệt hoa/thường). */
  static async timTheoMaCode(code: string, db: Db = prisma): Promise<MaGiamGia | null> {
    const d = await maGiamGiaRepository.timTheoCode(db, code);
    return d && new MaGiamGia(d);
  }

  /** Còn lượt sử dụng. */
  conLuotDung(): boolean {
    return this.daSuDung < this.soLuongToiDa;
  }

  /** Lý do mã không dùng được lúc này (null = dùng được). */
  lyDoKhongDung(ngay: Date = new Date()): string | null {
    if (this.trangThai !== "HOAT_DONG") return "Mã giảm giá đã ngừng hoạt động";
    if (ngay < this.ngayBatDau) return "Mã giảm giá chưa đến ngày áp dụng";
    if (!this.conHieuLuc(ngay)) return "Mã giảm giá đã hết hạn";
    if (!this.conLuotDung()) return "Mã giảm giá đã hết lượt sử dụng";
    return null;
  }

  /** Số tiền được giảm trên `tamTinh`: theo % hoặc số tiền cố định, không vượt `tamTinh`. */
  tinhTienGiam(tamTinh: number): number {
    return tinhGiamMa(this.loaiGiam as "PHAN_TRAM" | "SO_TIEN", Number(this.giaTriGiam), tamTinh);
  }

  /** Tăng 1 lượt đã dùng khi thanh toán (UPDATE có điều kiện còn lượt). */
  async tangLuotDung(db: Db = prisma): Promise<boolean> {
    const ok = await maGiamGiaRepository.tangLuotDung(db, this.maMGG);
    if (ok) this.daSuDung++;
    return ok;
  }

  /** Hoàn 1 lượt khi hóa đơn có áp mã bị hủy. */
  async hoanLuotDung(db: Db = prisma): Promise<boolean> {
    const ok = await maGiamGiaRepository.giamLuotDung(db, this.maMGG);
    if (ok) this.daSuDung--;
    return ok;
  }

  /** Lưu mã (thêm mới hoặc cập nhật). Kiểm tra dữ liệu ở khuyenMaiService. */
  async luu(): Promise<boolean> {
    const { maCode, loaiGiam, giaTriGiam, giaTriDonToiThieu, soLuongToiDa, ngayBatDau, ngayKetThuc, trangThai } = this;
    const data = { maCode, loaiGiam, giaTriGiam, giaTriDonToiThieu, soLuongToiDa, ngayBatDau, ngayKetThuc, trangThai };
    Object.assign(this, this.maMGG ? await maGiamGiaRepository.capNhat(this.maMGG, data) : await maGiamGiaRepository.tao({ ...data, daSuDung: 0 }));
    return true;
  }
}
