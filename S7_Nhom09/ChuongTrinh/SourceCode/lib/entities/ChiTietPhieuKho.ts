// Chi tiết của 3 loại phiếu kho:
//   ChiTietPhieuNhap – Bảng 3.71/3.72, ChiTietKiemKe – Bảng 3.73/3.74, ChiTietXuatHuy – Bảng 3.75/3.76.
import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/db";
import type {
  Prisma,
  ChiTietPhieuNhap as ChiTietPhieuNhapModel,
  ChiTietKiemKe as ChiTietKiemKeModel,
  ChiTietXuatHuy as ChiTietXuatHuyModel,
} from "@/lib/generated/prisma/client";
import { phieuKhoRepository } from "@/lib/repositories/phieuKhoRepository";

export class ChiTietPhieuNhap implements ChiTietPhieuNhapModel {
  // ───── Thuộc tính ─────
  declare maPN: number;
  declare maSach: number;
  declare soLuong: number;
  declare giaNhap: Prisma.Decimal;

  constructor(duLieu: ChiTietPhieuNhapModel) {
    Object.assign(this, duLieu);
  }

  // ───── Phương thức ─────

  /** Thành tiền nhập = số lượng × giá nhập. */
  thanhTien(): number {
    return this.soLuong * Number(this.giaNhap);
  }

  /** Sửa số lượng thực nhận (hàng giao thiếu – UC7.3 luồng 2a), chỉ khi phiếu còn Chờ duyệt. */
  async capNhatSoLuong(sl: number, db: Db = prisma): Promise<boolean> {
    const ok = await phieuKhoRepository.suaSoLuongChiTietNhap(db, this.maPN, this.maSach, sl);
    if (ok) this.soLuong = sl;
    return ok;
  }
}

export class ChiTietKiemKe implements ChiTietKiemKeModel {
  // ───── Thuộc tính ─────
  declare maPKK: number;
  declare maSach: number;
  declare slHeThong: number; // tồn kho lúc lập phiếu
  declare slThucTe: number; // đếm thực tế
  declare lyDoChenhLech: string | null;

  constructor(duLieu: ChiTietKiemKeModel) {
    Object.assign(this, duLieu);
  }

  // ───── Phương thức ─────

  /** Chênh lệch = thực tế − hệ thống (dương: thừa, âm: thiếu). Khi duyệt cộng chênh lệch này vào tồn hiện tại. */
  chenhLech(): number {
    return this.slThucTe - this.slHeThong;
  }
}

export class ChiTietXuatHuy implements ChiTietXuatHuyModel {
  // ───── Thuộc tính ─────
  declare maPXH: number;
  declare maSach: number;
  declare soLuong: number;
  declare lyDo: string | null;

  constructor(duLieu: ChiTietXuatHuyModel) {
    Object.assign(this, duLieu);
  }

  // ───── Phương thức ─────

  /** Sửa số lượng hủy của dòng, chỉ khi phiếu còn Chờ duyệt. */
  async capNhatSoLuong(sl: number, db: Db = prisma): Promise<boolean> {
    const ok = await phieuKhoRepository.suaSoLuongChiTietXuatHuy(db, this.maPXH, this.maSach, sl);
    if (ok) this.soLuong = sl;
    return ok;
  }
}
