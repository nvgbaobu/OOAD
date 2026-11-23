import type { Db } from "@/lib/db";

export const maOTPRepository = {
  /** Vô hiệu mọi OTP chưa dùng của tài khoản (khi cấp mã mới). */
  voHieuMaCu: (db: Db, maTK: number) => db.maOTP.updateMany({ where: { maTK, daSuDung: false }, data: { daSuDung: true } }),

  tao: (db: Db, maTK: number, maCode: string, thoiGianHetHan: Date) =>
    db.maOTP.create({ data: { maTK, maCode, thoiGianHetHan, daSuDung: false } }),

  /** OTP còn hiệu lực sử dụng mới nhất của tài khoản (mỗi lúc chỉ có tối đa 1 mã chưa dùng). */
  layMaChuaDung: (db: Db, maTK: number) =>
    db.maOTP.findFirst({ where: { maTK, daSuDung: false }, orderBy: { maOTP: "desc" } }),

  /** Đánh dấu đã dùng có điều kiện – trả về true nếu đúng 1 dòng đổi (OTP chỉ dùng được 1 lần). */
  async danhDauDaDung(db: Db, maOTP: number) {
    const n = await db.$executeRaw`UPDATE MaOTP SET daSuDung = 1 WHERE maOTP = ${maOTP} AND daSuDung = 0`;
    return n === 1;
  },
};
