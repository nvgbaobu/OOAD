import type { Db } from "@/lib/db";

import type { Prisma } from "@/lib/generated/prisma/client";

export const khachHangRepository = {
  tao: (db: Db, data: Prisma.KhachHangUncheckedCreateInput) => db.khachHang.create({ data }),
  /** Hạng thấp nhất – gán cho khách mới. */
  hangThapNhat: (db: Db) => db.hangThanhVien.findFirst({ orderBy: { diemToiThieu: "asc" } }),
  timTheoSoDienThoai: (db: Db, soDienThoai: string) => db.khachHang.findUnique({ where: { soDienThoai } }),
  /** Hạng cao nhất mà điểm tích lũy đạt được. */
  hangTheoDiem: (db: Db, diemTichLuy: number) =>
    db.hangThanhVien.findFirst({ where: { diemToiThieu: { lte: diemTichLuy } }, orderBy: { diemToiThieu: "desc" } }),

  /**
   * Hủy hóa đơn: hoàn điểm đã dùng, trừ điểm đã cộng (một câu UPDATE, không đọc-rồi-ghi).
   * Nếu khách đã tiêu bớt số điểm được cộng thì điểm hiện tại chỉ trừ về 0. Trả về số điểm thực tế bị trừ hụt.
   */
  async hoanDiemKhiHuy(db: Db, maKH: number, diemSuDung: number, diemCong: number) {
    const kh = await db.khachHang.findUniqueOrThrow({ where: { maKH }, select: { diemHienTai: true } });
    await db.$executeRaw`
      UPDATE KhachHang SET
        diemHienTai = CASE WHEN diemHienTai + ${diemSuDung} - ${diemCong} < 0 THEN 0 ELSE diemHienTai + ${diemSuDung} - ${diemCong} END,
        diemTichLuy = CASE WHEN diemTichLuy - ${diemCong} < 0 THEN 0 ELSE diemTichLuy - ${diemCong} END
      WHERE maKH = ${maKH}`;
    return Math.max(0, diemCong - diemSuDung - kh.diemHienTai);
  },
};
