import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

export type LocKhachHang = { tuKhoa?: string; maHang?: number; sapXep?: "moi" | "diem" };

function dieuKienLoc(loc: LocKhachHang): Prisma.KhachHangWhereInput {
  return {
    ...(loc.tuKhoa && {
      OR: [{ soDienThoai: { contains: loc.tuKhoa } }, { hoTen: { contains: loc.tuKhoa } }, { email: { contains: loc.tuKhoa } }],
    }),
    ...(loc.maHang && { maHang: loc.maHang }),
  };
}

export const khachHangRepository = {
  tao: (db: Db, data: Prisma.KhachHangUncheckedCreateInput) => db.khachHang.create({ data }),
  /** Hạng thấp nhất – gán cho khách mới. */
  hangThapNhat: (db: Db) => db.hangThanhVien.findFirst({ orderBy: { diemToiThieu: "asc" } }),
  timTheoSoDienThoai: (db: Db, soDienThoai: string) => db.khachHang.findUnique({ where: { soDienThoai } }),
  /** Hạng cao nhất mà điểm tích lũy đạt được. */
  hangTheoDiem: (db: Db, diemTichLuy: number) =>
    db.hangThanhVien.findFirst({ where: { diemToiThieu: { lte: diemTichLuy } }, orderBy: { diemToiThieu: "desc" } }),

  danhSach: (loc: LocKhachHang, boQua: number, lay: number) =>
    prisma.khachHang.findMany({
      where: dieuKienLoc(loc),
      include: { hangThanhVien: true },
      orderBy: loc.sapXep === "diem" ? [{ diemTichLuy: "desc" }, { maKH: "desc" }] : { maKH: "desc" },
      skip: boQua,
      take: lay,
    }),
  dem: (loc: LocKhachHang) => prisma.khachHang.count({ where: dieuKienLoc(loc) }),

  /** Số hóa đơn đã thanh toán + tổng chi tiêu của từng khách (không tính hóa đơn đã hủy). */
  async thongKeMua(maKHs: number[]) {
    if (!maKHs.length) return new Map<number, { soHoaDon: number; tongChiTieu: number }>();
    const r = await prisma.hoaDon.groupBy({
      by: ["maKH"], where: { maKH: { in: maKHs }, trangThai: "DA_THANH_TOAN" }, _count: true, _sum: { tongTien: true },
    });
    return new Map(r.map((x) => [x.maKH!, { soHoaDon: x._count, tongChiTieu: Number(x._sum.tongTien ?? 0) }]));
  },

  /**
   * Xét lại hạng mọi khách theo điểm tích lũy (1 câu UPDATE). boQuaHang: hạng sắp xóa – không xếp khách vào.
   * Trả về số khách đổi hạng.
   */
  xetLaiHang: (db: Db, boQuaHang = 0) =>
    db.$executeRaw`
      UPDATE k SET k.maHang = x.maHang
      FROM KhachHang k
      CROSS APPLY (
        SELECT TOP 1 h.maHang FROM HangThanhVien h
        WHERE h.diemToiThieu <= k.diemTichLuy AND h.maHang <> ${boQuaHang}
        ORDER BY h.diemToiThieu DESC
      ) x
      WHERE k.maHang <> x.maHang`,

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
