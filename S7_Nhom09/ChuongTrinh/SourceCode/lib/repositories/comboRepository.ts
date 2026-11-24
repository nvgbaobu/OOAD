import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/db";

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
};
