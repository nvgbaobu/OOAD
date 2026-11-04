import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

/** Lọc hóa đơn. trangThai: DA_THANH_TOAN | DA_HUY (đã thanh toán rồi hủy) | NHAP_HUY (đơn nháp bị hủy). */
export type LocHoaDon = {
  tuKhoa?: string; tuNgay?: Date; denNgay?: Date; // denNgay: loại trừ (đầu ngày hôm sau)
  trangThai?: "DA_THANH_TOAN" | "DA_HUY" | "NHAP_HUY"; maTK?: number; phuongThucTT?: string;
};

function dieuKienLoc(loc: LocHoaDon): Prisma.HoaDonWhereInput {
  const tk = loc.tuKhoa?.replace(/^#/, "");
  const trangThai: Prisma.HoaDonWhereInput =
    loc.trangThai === "DA_THANH_TOAN" ? { trangThai: "DA_THANH_TOAN" }
    : loc.trangThai === "DA_HUY" ? { trangThai: "DA_HUY", phuongThucTT: { not: null } }
    : loc.trangThai === "NHAP_HUY" ? { trangThai: "DA_HUY", phuongThucTT: null }
    : { trangThai: { not: "DANG_LAP" } };
  return {
    ...trangThai,
    ...(tk && {
      OR: [
        ...(/^\d{1,9}$/.test(tk) ? [{ maHD: Number(tk) }] : []),
        { khachHang: { soDienThoai: { contains: tk } } },
        { khachHang: { hoTen: { contains: tk } } },
      ],
    }),
    ...((loc.tuNgay || loc.denNgay) && { thoiGianTao: { ...(loc.tuNgay && { gte: loc.tuNgay }), ...(loc.denNgay && { lt: loc.denNgay }) } }),
    ...(loc.maTK && { maTK: loc.maTK }),
    ...(loc.phuongThucTT && { phuongThucTT: loc.phuongThucTT }),
  };
}

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

  danhSach: (loc: LocHoaDon, boQua: number, lay: number) =>
    prisma.hoaDon.findMany({
      where: dieuKienLoc(loc),
      include: {
        taiKhoan: { select: { hoTen: true } },
        khachHang: { select: { hoTen: true, soDienThoai: true } },
        _count: { select: { chiTiets: true } },
      },
      orderBy: { maHD: "desc" },
      skip: boQua,
      take: lay,
    }),

  /** Số hóa đơn theo bộ lọc + doanh thu (chỉ tính DA_THANH_TOAN trong bộ lọc). */
  async tongHop(loc: LocHoaDon) {
    const where = dieuKienLoc(loc);
    const [soHoaDon, dt] = await Promise.all([
      prisma.hoaDon.count({ where }),
      prisma.hoaDon.aggregate({ where: { AND: [where, { trangThai: "DA_THANH_TOAN" }] }, _sum: { tongTien: true }, _count: true }),
    ]);
    return { soHoaDon, soDaThanhToan: dt._count, doanhThu: Number(dt._sum.tongTien ?? 0) };
  },

  /** Hủy hóa đơn đã thanh toán – chỉ khi còn DA_THANH_TOAN. */
  async huyDaThanhToan(db: Db, maHD: number, lyDoHuy: string) {
    const r = await db.hoaDon.updateMany({
      where: { maHD, trangThai: "DA_THANH_TOAN" },
      data: { trangThai: "DA_HUY", lyDoHuy, thoiGianCapNhat: new Date() },
    });
    return r.count === 1;
  },
};
