// Lớp thực thể ChiTietHoaDon – Bảng 3.51 (thuộc tính), Bảng 3.52 (phương thức).
import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/db";
import type { Prisma, ChiTietHoaDon as ChiTietHoaDonModel } from "@/lib/generated/prisma/client";
import { hoaDonRepository } from "@/lib/repositories/hoaDonRepository";

export class ChiTietHoaDon implements ChiTietHoaDonModel {
  // ───── Thuộc tính ─────
  declare maHD: number;
  declare maSach: number;
  declare soLuong: number;
  declare donGiaBan: Prisma.Decimal; // snapshot giá bán lúc thêm vào đơn
  declare thanhTien: Prisma.Decimal;

  constructor(duLieu: ChiTietHoaDonModel) {
    Object.assign(this, duLieu);
  }

  // ───── Phương thức ─────

  /** Thành tiền = số lượng × đơn giá bán. (Báo cáo: thanhTien() – trùng tên cột thanhTien nên đặt tinhThanhTien().) */
  tinhThanhTien(): number {
    return Number(this.donGiaBan) * this.soLuong;
  }

  /** Đổi số lượng của dòng trong đơn đang lập (0 = bỏ dòng), tính lại thành tiền. */
  async capNhatSoLuong(sl: number, db: Db = prisma): Promise<void> {
    if (sl === 0) {
      await hoaDonRepository.xoaChiTiet(db, this.maHD, this.maSach);
      this.soLuong = 0;
      return;
    }
    this.soLuong = sl;
    Object.assign(this, await hoaDonRepository.capNhatChiTiet(db, this.maHD, this.maSach, { soLuong: sl, thanhTien: this.tinhThanhTien() }));
  }
}
