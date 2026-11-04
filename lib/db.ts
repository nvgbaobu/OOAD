import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/** Client dùng được cả ngoài và trong transaction – repository nhận tham số này. */
export type Db = typeof prisma | Prisma.TransactionClient;
