import type { Db } from "@/lib/db";

export const comboRepository = {
  /** Combo đang hoạt động và trong thời gian áp dụng. */
  layConHieuLuc: (db: Db, luc = new Date()) =>
    db.combo.findMany({
      where: { trangThai: "HOAT_DONG", ngayBatDau: { lte: luc }, ngayKetThuc: { gte: luc } },
      include: { chiTiets: true },
    }),
};
