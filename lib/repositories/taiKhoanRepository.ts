import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

const congKhai = { maTK: true, soDienThoai: true, hoTen: true, email: true, vaiTro: true, trangThai: true, ngayTao: true } as const;

export const taiKhoanRepository = {
  timTheoSoDienThoai: (soDienThoai: string) => prisma.taiKhoan.findUnique({ where: { soDienThoai } }),
  timTheoMa: (maTK: number) => prisma.taiKhoan.findUnique({ where: { maTK } }),
  /** Danh sách tài khoản (không trả hash mật khẩu) + số hóa đơn đã lập. */
  danhSach: () =>
    prisma.taiKhoan.findMany({
      select: { ...congKhai, _count: { select: { hoaDons: { where: { trangThai: "DA_THANH_TOAN" } } } } },
      orderBy: [{ vaiTro: "asc" }, { maTK: "asc" }],
    }),
  layCongKhai: (maTK: number) => prisma.taiKhoan.findUnique({ where: { maTK }, select: congKhai }),
  tao: (data: Prisma.TaiKhoanUncheckedCreateInput) => prisma.taiKhoan.create({ data, select: congKhai }),
  capNhat: (maTK: number, data: Prisma.TaiKhoanUncheckedUpdateInput) => prisma.taiKhoan.update({ where: { maTK }, data }),
  demAdminHoatDong: () => prisma.taiKhoan.count({ where: { vaiTro: "ADMIN", trangThai: "HOAT_DONG" } }),
};
