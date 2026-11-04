import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/db";

export const sachRepository = {
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
