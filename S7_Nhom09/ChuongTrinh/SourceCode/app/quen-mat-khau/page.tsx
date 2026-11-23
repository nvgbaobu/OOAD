import type { Metadata } from "next";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import FormQuenMatKhau from "./FormQuenMatKhau";

export const metadata: Metadata = { title: "Quên mật khẩu" };

// Trang công khai (chưa đăng nhập). Đã đăng nhập thì proxy.ts chuyển về trang chủ theo vai trò.
export default async function TrangQuenMatKhau() {
  // Render lúc có request (không prerender lúc build): trang đọc DB, mà lúc build Docker/CI không có DB.
  await connection();
  const cauHinh = await prisma.cauHinhHeThong.findUnique({ where: { maCH: 1 }, select: { tenCuaHang: true } });
  return (
    <main className="flex flex-1 items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow">
        <h1 className="text-center text-xl font-bold">{cauHinh?.tenCuaHang ?? "Nhà sách"}</h1>
        <p className="mb-6 text-center text-sm text-gray-500">Khôi phục mật khẩu bằng mã OTP</p>
        <FormQuenMatKhau />
      </div>
    </main>
  );
}
