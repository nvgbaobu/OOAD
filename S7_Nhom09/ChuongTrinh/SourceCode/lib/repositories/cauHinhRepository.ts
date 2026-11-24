import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/db";

export const cauHinhRepository = {
  lay: async (db: Db = prisma) => {
    const ch = await db.cauHinhHeThong.findUnique({ where: { maCH: 1 } });
    if (!ch) throw new Error("Chưa có cấu hình hệ thống (CauHinhHeThong). Hãy chạy seed.");
    return ch;
  },
};
