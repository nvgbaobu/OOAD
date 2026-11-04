import { prisma } from "@/lib/prisma";

export const taiKhoanRepository = {
  timTheoSoDienThoai: (soDienThoai: string) => prisma.taiKhoan.findUnique({ where: { soDienThoai } }),
  timTheoMa: (maTK: number) => prisma.taiKhoan.findUnique({ where: { maTK } }),
};
