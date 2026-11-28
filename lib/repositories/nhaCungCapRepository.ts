import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

export type LocNhaCungCap = { tuKhoa?: string; trangThai?: string };

export const nhaCungCapRepository = {
  danhSach: (loc: LocNhaCungCap) =>
    prisma.nhaCungCap.findMany({
      where: {
        ...(loc.tuKhoa && {
          OR: [{ tenNCC: { contains: loc.tuKhoa } }, { maSoThue: { contains: loc.tuKhoa } }, { soDienThoai: { contains: loc.tuKhoa } }, { nguoiLienHe: { contains: loc.tuKhoa } }],
        }),
        ...(loc.trangThai && { trangThaiHopTac: loc.trangThai }),
      },
      include: { _count: { select: { phieuNhaps: true } } },
      orderBy: [{ trangThaiHopTac: "asc" }, { tenNCC: "asc" }],
    }),
  dangGiaoDich: () =>
    prisma.nhaCungCap.findMany({ where: { trangThaiHopTac: "DANG_GIAO_DICH" }, select: { maNCC: true, tenNCC: true }, orderBy: { tenNCC: "asc" } }),
  timTheoMa: (maNCC: number) => prisma.nhaCungCap.findUnique({ where: { maNCC } }),
  timTheoMaSoThue: (maSoThue: string) => prisma.nhaCungCap.findUnique({ where: { maSoThue } }),
  tao: (data: Prisma.NhaCungCapUncheckedCreateInput) => prisma.nhaCungCap.create({ data }),
  capNhat: (maNCC: number, data: Prisma.NhaCungCapUncheckedUpdateInput) => prisma.nhaCungCap.update({ where: { maNCC }, data }),
  xoa: (maNCC: number) => prisma.nhaCungCap.delete({ where: { maNCC } }),
  demPhieuNhap: (maNCC: number) => prisma.phieuNhap.count({ where: { maNCC } }),
  phieuNhapGanDay: (maNCC: number, lay = 20) =>
    prisma.phieuNhap.findMany({
      where: { maNCC }, orderBy: { maPN: "desc" }, take: lay,
      select: { maPN: true, ngayLap: true, trangThai: true, tongTien: true, nguoiLap: { select: { hoTen: true } } },
    }),
  /** Tổng hợp phiếu nhập đã duyệt của NCC. */
  async thongKeNhap(maNCC: number) {
    const r = await prisma.phieuNhap.aggregate({ where: { maNCC, trangThai: "DA_DUYET" }, _count: true, _sum: { tongTien: true } });
    return { soPhieu: r._count, tongTien: Number(r._sum.tongTien ?? 0) };
  },
};
