import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

export const cauHinhRepository = {
  lay: async (db: Db = prisma) => {
    const ch = await db.cauHinhHeThong.findUnique({ where: { maCH: 1 } });
    if (!ch) throw new Error("Chưa có cấu hình hệ thống (CauHinhHeThong). Hãy chạy seed.");
    return ch;
  },
  capNhat: (db: Db, data: Prisma.CauHinhHeThongUpdateInput) => db.cauHinhHeThong.update({ where: { maCH: 1 }, data }),
};
