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
};
