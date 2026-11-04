import { prisma } from "@/lib/prisma";

export type GhiNhatKy = { maTK?: number | null; module: string; hanhDong: string; noiDung?: string };

export const nhatKyRepository = {
  ghi: (nk: GhiNhatKy) =>
    prisma.nhatKyHeThong.create({
      data: { maTK: nk.maTK ?? null, module: nk.module, hanhDong: nk.hanhDong, noiDung: nk.noiDung },
    }),
};
