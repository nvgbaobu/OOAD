import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

export const banSaoLuuRepository = {
  /**
   * BACKUP DATABASE … COPY_ONLY (không chạy được trong transaction).
   * Tên CSDL / đường dẫn do hệ thống tự sinh và đã kiểm tra chỉ gồm chữ, số, _ → ghép chuỗi an toàn.
   */
  saoLuuCSDL: (tenCSDL: string, duongDan: string, tenFile: string) =>
    prisma.$executeRawUnsafe(`BACKUP DATABASE [${tenCSDL}] TO DISK = N'${duongDan}' WITH INIT, COPY_ONLY, NAME = N'${tenFile}'`),

  /** Kích thước bản sao lưu (byte) lấy từ lịch sử backup của SQL Server. */
  async kichThuoc(tenCSDL: string, tenFile: string) {
    const [kq] = await prisma.$queryRaw<{ kichThuoc: bigint | number }[]>`
      SELECT TOP 1 CAST(backup_size AS BIGINT) AS kichThuoc FROM msdb.dbo.backupset
      WHERE database_name = ${tenCSDL} AND name = ${tenFile} ORDER BY backup_finish_date DESC`;
    return BigInt(kq?.kichThuoc ?? 0);
  },

  tao: (data: Prisma.BanSaoLuuUncheckedCreateInput) => prisma.banSaoLuu.create({ data }),
  timTheoMa: (maBackup: number) => prisma.banSaoLuu.findUnique({ where: { maBackup } }),
};
