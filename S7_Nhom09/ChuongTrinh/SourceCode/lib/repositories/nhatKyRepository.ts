import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

export type GhiNhatKy = { maTK?: number | null; module: string; hanhDong: string; noiDung?: string };

export const nhatKyRepository = {
  ghi: (nk: GhiNhatKy, db: Db = prisma) =>
    db.nhatKyHeThong.create({
      data: { maTK: nk.maTK ?? null, module: nk.module, hanhDong: nk.hanhDong, noiDung: nk.noiDung },
    }),
  traCuu: (where: Prisma.NhatKyHeThongWhereInput, boQua: number, lay: number) =>
    prisma.nhatKyHeThong.findMany({ where, include: { taiKhoan: { select: { hoTen: true } } }, orderBy: { maLog: "desc" }, skip: boQua, take: lay }),
  dem: (where: Prisma.NhatKyHeThongWhereInput) => prisma.nhatKyHeThong.count({ where }),
};
