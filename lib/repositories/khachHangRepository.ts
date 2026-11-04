import type { Db } from "@/lib/db";

export const khachHangRepository = {
  timTheoSoDienThoai: (db: Db, soDienThoai: string) => db.khachHang.findUnique({ where: { soDienThoai } }),
  /** Hạng cao nhất mà điểm tích lũy đạt được. */
  hangTheoDiem: (db: Db, diemTichLuy: number) =>
    db.hangThanhVien.findFirst({ where: { diemToiThieu: { lte: diemTichLuy } }, orderBy: { diemToiThieu: "desc" } }),
};
