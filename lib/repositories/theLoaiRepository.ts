import { prisma } from "@/lib/prisma";

export const theLoaiRepository = {
  tatCa: () => prisma.theLoai.findMany({ orderBy: { tenTL: "asc" } }),
  tatCaKemSoSach: () =>
    prisma.theLoai.findMany({ orderBy: { tenTL: "asc" }, include: { _count: { select: { sachs: true } } } }),
  timTheoMa: (maTL: number) => prisma.theLoai.findUnique({ where: { maTL } }),
  timTheoTen: (tenTL: string) => prisma.theLoai.findUnique({ where: { tenTL } }),
  demSach: (maTL: number) => prisma.sach.count({ where: { maTL } }),
  tao: (tenTL: string, thueSuatVAT: number) => prisma.theLoai.create({ data: { tenTL, thueSuatVAT } }),
  capNhat: (maTL: number, tenTL: string, thueSuatVAT: number) =>
    prisma.theLoai.update({ where: { maTL }, data: { tenTL, thueSuatVAT } }),
  xoa: (maTL: number) => prisma.theLoai.delete({ where: { maTL } }),
};
