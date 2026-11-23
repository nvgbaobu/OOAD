import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/db";

export type GhiNhatKy = { maTK?: number | null; module: string; hanhDong: string; noiDung?: string };

export const nhatKyRepository = {
  ghi: (nk: GhiNhatKy, db: Db = prisma) =>
    db.nhatKyHeThong.create({
      data: { maTK: nk.maTK ?? null, module: nk.module, hanhDong: nk.hanhDong, noiDung: nk.noiDung },
    }),
};
