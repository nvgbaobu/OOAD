import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

export type LocSach = { tuKhoa?: string; maTL?: number; trangThai?: string; sapHet?: boolean };

function dieuKienLoc(loc: LocSach): Prisma.SachWhereInput {
  return {
    ...(loc.tuKhoa && {
      OR: [{ tenSach: { contains: loc.tuKhoa } }, { isbn: { contains: loc.tuKhoa } }, { tacGia: { contains: loc.tuKhoa } }],
    }),
    ...(loc.maTL && { maTL: loc.maTL }),
    ...(loc.trangThai && { trangThai: loc.trangThai }),
    // Sắp hết: tồn kho ≤ định mức tối thiểu (so sánh 2 cột bằng field reference)
    ...(loc.sapHet && { soLuongTon: { lte: prisma.sach.fields.dinhMucToiThieu } }),
  };
}

export const sachRepository = {
  danhSach: (loc: LocSach, boQua: number, lay: number) =>
    prisma.sach.findMany({
      where: dieuKienLoc(loc),
      include: { theLoai: true },
      orderBy: [{ trangThai: "asc" }, { tenSach: "asc" }],
      skip: boQua,
      take: lay,
    }),
  dem: (loc: LocSach) => prisma.sach.count({ where: dieuKienLoc(loc) }),
  timTheoIsbn: (isbn: string) => prisma.sach.findUnique({ where: { isbn } }),
  tao: (data: Prisma.SachUncheckedCreateInput) => prisma.sach.create({ data }),
  capNhat: (maSach: number, data: Prisma.SachUncheckedUpdateInput) => prisma.sach.update({ where: { maSach }, data }),

  /** Sách đang bán, tìm theo tên / ISBN / tác giả (POS). */
  timDeBan: (tuKhoa: string, gioiHan = 20) =>
    prisma.sach.findMany({
      where: {
        trangThai: "DANG_BAN",
        ...(tuKhoa && {
          OR: [{ tenSach: { contains: tuKhoa } }, { isbn: { contains: tuKhoa } }, { tacGia: { contains: tuKhoa } }],
        }),
      },
      include: { theLoai: true },
      orderBy: { tenSach: "asc" },
      take: gioiHan,
    }),

  timTheoMa: (db: Db, maSach: number) => db.sach.findUnique({ where: { maSach }, include: { theLoai: true } }),

  /** Tăng tạm giữ nếu còn đủ hàng bán được. Trả về true nếu thành công. */
  async tangTamGiu(db: Db, maSach: number, soLuong: number) {
    const n = await db.$executeRaw`
      UPDATE Sach SET soLuongTamGiu = soLuongTamGiu + ${soLuong}
      WHERE maSach = ${maSach} AND trangThai = N'DANG_BAN' AND soLuongTon - soLuongTamGiu >= ${soLuong}`;
    return n === 1;
  },

  async giamTamGiu(db: Db, maSach: number, soLuong: number) {
    const n = await db.$executeRaw`
      UPDATE Sach SET soLuongTamGiu = soLuongTamGiu - ${soLuong}
      WHERE maSach = ${maSach} AND soLuongTamGiu >= ${soLuong}`;
    return n === 1;
  },

  /** Thanh toán: trừ tồn kho và giải phóng tạm giữ cùng lúc. */
  async xuatBan(db: Db, maSach: number, soLuong: number) {
    const n = await db.$executeRaw`
      UPDATE Sach SET soLuongTon = soLuongTon - ${soLuong}, soLuongTamGiu = soLuongTamGiu - ${soLuong}
      WHERE maSach = ${maSach} AND soLuongTamGiu >= ${soLuong} AND soLuongTon >= ${soLuong}`;
    return n === 1;
  },
};
