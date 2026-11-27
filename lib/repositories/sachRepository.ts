import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

export type LocSach = { tuKhoa?: string; maTL?: number; nhaXuatBan?: string; trangThai?: string; sapHet?: boolean };

function dieuKienLoc(loc: LocSach): Prisma.SachWhereInput {
  return {
    ...(loc.tuKhoa && {
      OR: [{ tenSach: { contains: loc.tuKhoa } }, { isbn: { contains: loc.tuKhoa } }, { tacGia: { contains: loc.tuKhoa } }],
    }),
    ...(loc.maTL && { maTL: loc.maTL }),
    ...(loc.nhaXuatBan && { nhaXuatBan: loc.nhaXuatBan }),
    ...(loc.trangThai && { trangThai: loc.trangThai }),
    // Sắp hết: tồn kho ≤ định mức tối thiểu (so sánh 2 cột bằng field reference)
    ...(loc.sapHet && { soLuongTon: { lte: prisma.sach.fields.dinhMucToiThieu } }),
  };
}

export const sachRepository = {
  /** Danh sách nhà xuất bản đang có (bộ lọc UC2.1). */
  async danhSachNXB() {
    const ds = await prisma.sach.findMany({
      where: { nhaXuatBan: { not: null } }, distinct: ["nhaXuatBan"], select: { nhaXuatBan: true }, orderBy: { nhaXuatBan: "asc" },
    });
    return ds.map((s) => s.nhaXuatBan!).filter(Boolean);
  },

  danhSach: (loc: LocSach, boQua: number, lay: number) =>
    prisma.sach.findMany({
      where: dieuKienLoc(loc),
      include: { theLoai: true },
      orderBy: [{ trangThai: "asc" }, { tenSach: "asc" }],
      skip: boQua,
      take: lay,
    }),
  dem: (loc: LocSach) => prisma.sach.count({ where: dieuKienLoc(loc) }),
  timTheoIsbn: (isbn: string) => prisma.sach.findUnique({ where: { isbn } }),
  tao: (data: Prisma.SachUncheckedCreateInput) => prisma.sach.create({ data }),
  capNhat: (maSach: number, data: Prisma.SachUncheckedUpdateInput) => prisma.sach.update({ where: { maSach }, data }),

  /** UC2.4: ngừng kinh doanh chỉ khi không còn cuốn nào bị tạm giữ trong đơn chưa thanh toán.
   *  UPDATE có điều kiện → không lọt trường hợp quầy khác vừa thêm sách vào giỏ. */
  async ngungKinhDoanhNeuKhongTamGiu(maSach: number) {
    const n = await prisma.$executeRaw`
      UPDATE Sach SET trangThai = N'NGUNG_KINH_DOANH'
      WHERE maSach = ${maSach} AND trangThai = N'DANG_BAN' AND soLuongTamGiu = 0`;
    return n === 1;
  },

  /** Số đơn đang lập (POS chưa thanh toán) có chứa sách. */
  soDonDangLapChua: (maSach: number) =>
    prisma.chiTietHoaDon.count({ where: { maSach, hoaDon: { trangThai: "DANG_LAP" } } }),

  /** Sách đang bán, tìm theo tên / ISBN / tác giả (POS). */
  timDeBan: (tuKhoa: string, gioiHan = 20) =>
    prisma.sach.findMany({
      where: {
        trangThai: "DANG_BAN",
        ...(tuKhoa && {
          OR: [{ tenSach: { contains: tuKhoa } }, { isbn: { contains: tuKhoa } }, { tacGia: { contains: tuKhoa } }],
        }),
      },
      include: { theLoai: true },
      orderBy: { tenSach: "asc" },
      take: gioiHan,
    }),

  /** Đặt định mức tối thiểu cho nhiều sách cùng lúc (UC4.2). Trả về số sách đã cập nhật. */
  datDinhMuc: (maSachs: number[], dinhMuc: number) =>
    prisma.sach.updateMany({ where: { maSach: { in: maSachs } }, data: { dinhMucToiThieu: dinhMuc } }).then((r) => r.count),

  timTheoMa: (db: Db, maSach: number) => db.sach.findUnique({ where: { maSach }, include: { theLoai: true } }),

  /** Tăng tạm giữ nếu còn đủ hàng bán được. Trả về true nếu thành công. */
  async tangTamGiu(db: Db, maSach: number, soLuong: number) {
    const n = await db.$executeRaw`
      UPDATE Sach SET soLuongTamGiu = soLuongTamGiu + ${soLuong}
      WHERE maSach = ${maSach} AND trangThai = N'DANG_BAN' AND soLuongTon - soLuongTamGiu >= ${soLuong}`;
    return n === 1;
  },

  async giamTamGiu(db: Db, maSach: number, soLuong: number) {
    const n = await db.$executeRaw`
      UPDATE Sach SET soLuongTamGiu = soLuongTamGiu - ${soLuong}
      WHERE maSach = ${maSach} AND soLuongTamGiu >= ${soLuong}`;
    return n === 1;
  },

  /** Thanh toán: trừ tồn kho và giải phóng tạm giữ cùng lúc. */
  async xuatBan(db: Db, maSach: number, soLuong: number) {
    const n = await db.$executeRaw`
      UPDATE Sach SET soLuongTon = soLuongTon - ${soLuong}, soLuongTamGiu = soLuongTamGiu - ${soLuong}
      WHERE maSach = ${maSach} AND soLuongTamGiu >= ${soLuong} AND soLuongTon >= ${soLuong}`;
    return n === 1;
  },

  /**
   * Cộng/trừ tồn kho (duyệt phiếu kiểm kê / xuất hủy / nhập). Chỉ thành công nếu sau khi đổi
   * tồn kho vẫn ≥ số đang tạm giữ trong đơn chưa thanh toán (nên cũng ≥ 0).
   */
  async dieuChinhTon(db: Db, maSach: number, chenhLech: number) {
    const n = await db.$executeRaw`
      UPDATE Sach SET soLuongTon = soLuongTon + ${chenhLech}
      WHERE maSach = ${maSach} AND soLuongTon + ${chenhLech} >= soLuongTamGiu`;
    return n === 1;
  },

  /** Cập nhật giá nhập mới nhất (duyệt phiếu nhập) – chỉ khi vẫn ≤ giá bán. */
  async capNhatGiaNhap(db: Db, maSach: number, giaNhap: number) {
    const n = await db.$executeRaw`UPDATE Sach SET giaNhap = ${giaNhap} WHERE maSach = ${maSach} AND giaBan >= ${giaNhap}`;
    return n === 1;
  },

  /** Danh sách gọn để chọn sách khi lập phiếu kho. */
  tatCaDeChon: () =>
    prisma.sach.findMany({
      select: {
        maSach: true, tenSach: true, isbn: true, viTriKe: true, soLuongTon: true, soLuongTamGiu: true, trangThai: true,
        dinhMucToiThieu: true, giaNhap: true, giaBan: true,
      },
      orderBy: { tenSach: "asc" },
    }),

  /** Sách đang bán có tồn ≤ định mức, ít nhất lên trước. */
  sapHetHang: () =>
    prisma.sach.findMany({
      where: { trangThai: "DANG_BAN", soLuongTon: { lte: prisma.sach.fields.dinhMucToiThieu } },
      include: { theLoai: true },
      orderBy: [{ soLuongTon: "asc" }, { tenSach: "asc" }],
    }),

  /** Tổng quan kho: số đầu sách, tổng số cuốn, giá trị tồn theo giá nhập. */
  async thongKeTon() {
    const [r] = await prisma.$queryRaw<{ soDauSach: number; tongCuon: number; giaTriTon: number }[]>`
      SELECT COUNT(*) AS soDauSach, COALESCE(SUM(soLuongTon), 0) AS tongCuon,
             COALESCE(SUM(CAST(soLuongTon AS DECIMAL(18,2)) * giaNhap), 0) AS giaTriTon
      FROM Sach WHERE trangThai = N'DANG_BAN'`;
    return { soDauSach: Number(r.soDauSach), tongCuon: Number(r.tongCuon), giaTriTon: Number(r.giaTriTon) };
  },
};
