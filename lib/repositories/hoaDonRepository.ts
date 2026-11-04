import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/db";

const kemChiTiet = {
  chiTiets: { include: { sach: { select: { tenSach: true, isbn: true, soLuongTon: true, soLuongTamGiu: true } } }, orderBy: { maSach: "asc" } },
  khachHang: { include: { hangThanhVien: true } },
  maGiamGia: true,
} as const;

export const hoaDonRepository = {
  /** Đơn đang lập của nhân viên (mỗi nhân viên tối đa 1 đơn DANG_LAP). */
  layDonDangLap: (db: Db, maTK: number) =>
    db.hoaDon.findFirst({ where: { maTK, trangThai: "DANG_LAP" }, include: kemChiTiet, orderBy: { maHD: "desc" } }),

  taoDonDangLap: (db: Db, maTK: number) => db.hoaDon.create({ data: { maTK, trangThai: "DANG_LAP" } }),

  layChiTiet: (db: Db, maHD: number, maSach: number) =>
    db.chiTietHoaDon.findUnique({ where: { maHD_maSach: { maHD, maSach } } }),

  layHoaDonDayDu: (maHD: number) =>
    prisma.hoaDon.findUnique({
      where: { maHD },
      include: { ...kemChiTiet, taiKhoan: { select: { hoTen: true } } },
    }),
};
