import { PrismaMssql } from "@prisma/adapter-mssql";
import { PrismaClient } from "@/lib/generated/prisma/client";

// Dùng chung 1 PrismaClient (tránh tạo nhiều kết nối khi Next.js hot-reload)
function createClient() {
  const adapter = new PrismaMssql({
    server: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 1433),
    database: process.env.DB_NAME ?? "QuanLyBanSach",
    user: process.env.DB_USER ?? "sa",
    password: process.env.DB_PASSWORD ?? "",
    options: { encrypt: true, trustServerCertificate: true },
  });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
