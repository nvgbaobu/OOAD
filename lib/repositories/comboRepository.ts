import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

const kemSach = { chiTiets: { include: { sach: { select: { maSach: true, tenSach: true, giaBan: true, trangThai: true } } } } } as const;

export const comboRepository = {
  /** Combo đang hoạt động và trong thời gian áp dụng. */
  layConHieuLuc: (db: Db, luc = new Date()) =>
    db.combo.findMany({
      where: { trangThai: "HOAT_DONG", ngayBatDau: { lte: luc }, ngayKetThuc: { gte: luc } },
      include: { chiTiets: true },
    }),

  danhSach: () => prisma.combo.findMany({ include: kemSach, orderBy: [{ ngayKetThuc: "desc" }, { maCombo: "desc" }] }),
  timTheoMa: (maCombo: number) => prisma.combo.findUnique({ where: { maCombo }, include: kemSach }),

  /** Thêm combo (maCombo = null) hoặc sửa: thay toàn bộ dòng sách, trong 1 transaction. Trả về null nếu combo cần sửa không còn. */
  luu: (maCombo: number | null, data: Omit<Prisma.ComboCreateInput, "trangThai" | "chiTiets">, dong: { maSach: number; soLuong: number }[]) =>
    prisma.$transaction(async (tx) => {
      if (maCombo === null) return tx.combo.create({ data: { ...data, trangThai: "HOAT_DONG", chiTiets: { create: dong } } });
      if (!(await tx.combo.findUnique({ where: { maCombo } }))) return null;
      await tx.chiTietCombo.deleteMany({ where: { maCombo } });
      return tx.combo.update({ where: { maCombo }, data: { ...data, chiTiets: { create: dong } } });
    }),
};
