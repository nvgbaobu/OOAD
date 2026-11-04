import type { Db } from "@/lib/db";

export const maGiamGiaRepository = {
  timTheoCode: (db: Db, maCode: string) => db.maGiamGia.findUnique({ where: { maCode } }),

  /** Tăng lượt dùng nếu còn lượt. Trả về true nếu thành công. */
  async tangLuotDung(db: Db, maMGG: number) {
    const n = await db.$executeRaw`
      UPDATE MaGiamGia SET daSuDung = daSuDung + 1 WHERE maMGG = ${maMGG} AND daSuDung < soLuongToiDa`;
    return n === 1;
  },

  /** Hoàn 1 lượt dùng (hủy hóa đơn đã dùng mã). */
  async giamLuotDung(db: Db, maMGG: number) {
    const n = await db.$executeRaw`UPDATE MaGiamGia SET daSuDung = daSuDung - 1 WHERE maMGG = ${maMGG} AND daSuDung > 0`;
    return n === 1;
  },
};
