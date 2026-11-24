import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

/** Tình trạng hiển thị của mã (suy ra từ trạng thái, ngày, lượt dùng). */
export type TinhTrangMa = "DANG_AP_DUNG" | "CHUA_BAT_DAU" | "HET_HAN" | "HET_LUOT" | "NGUNG";

function dieuKienTinhTrang(t: TinhTrangMa | undefined, luc: Date): Prisma.MaGiamGiaWhereInput {
  const hoatDong = { trangThai: "HOAT_DONG" };
  switch (t) {
    case "NGUNG": return { trangThai: "NGUNG_HOAT_DONG" };
    case "CHUA_BAT_DAU": return { ...hoatDong, ngayBatDau: { gt: luc } };
    case "HET_HAN": return { ...hoatDong, ngayKetThuc: { lt: luc } };
    case "HET_LUOT": return { ...hoatDong, ngayBatDau: { lte: luc }, ngayKetThuc: { gte: luc }, daSuDung: { gte: prisma.maGiamGia.fields.soLuongToiDa } };
    case "DANG_AP_DUNG": return { ...hoatDong, ngayBatDau: { lte: luc }, ngayKetThuc: { gte: luc }, daSuDung: { lt: prisma.maGiamGia.fields.soLuongToiDa } };
    default: return {};
  }
}

export const maGiamGiaRepository = {
  timTheoCode: (db: Db, maCode: string) => db.maGiamGia.findUnique({ where: { maCode } }),
  timTheoMa: (maMGG: number) => prisma.maGiamGia.findUnique({ where: { maMGG } }),

  danhSach: (loc: { tuKhoa?: string; tinhTrang?: TinhTrangMa }, luc = new Date()) =>
    prisma.maGiamGia.findMany({
      where: { ...(loc.tuKhoa && { maCode: { contains: loc.tuKhoa } }), ...dieuKienTinhTrang(loc.tinhTrang, luc) },
      orderBy: [{ ngayKetThuc: "desc" }, { maMGG: "desc" }],
    }),
  tao: (data: Prisma.MaGiamGiaUncheckedCreateInput) => prisma.maGiamGia.create({ data }),
  capNhat: (maMGG: number, data: Prisma.MaGiamGiaUncheckedUpdateInput) => prisma.maGiamGia.update({ where: { maMGG }, data }),
  xoa: (maMGG: number) => prisma.maGiamGia.delete({ where: { maMGG } }),
  demHoaDon: (maMGG: number) => prisma.hoaDon.count({ where: { maMGG } }),

  /** Hiệu quả của mã: số hóa đơn đã thanh toán dùng mã + tổng tiền đã giảm. */
  async thongKe(maMGG: number) {
    const r = await prisma.hoaDon.aggregate({ where: { maMGG, trangThai: "DA_THANH_TOAN" }, _count: true, _sum: { giamMaGiamGia: true, tongTien: true } });
    return { soHoaDon: r._count, tongGiam: Number(r._sum.giamMaGiamGia ?? 0), doanhThu: Number(r._sum.tongTien ?? 0) };
  },

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
