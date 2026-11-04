import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { layNguoiDung, trangChuTheoVaiTro } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import FormDangNhap from "./FormDangNhap";

export const metadata: Metadata = { title: "Đăng nhập" };

export default async function TrangDangNhap() {
  const nd = await layNguoiDung();
  if (nd) redirect(trangChuTheoVaiTro(nd.vaiTro));

  const cauHinh = await prisma.cauHinhHeThong.findUnique({ where: { maCH: 1 }, select: { tenCuaHang: true } });

  return (
    <main className="flex flex-1 items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow">
        <h1 className="text-center text-xl font-bold">{cauHinh?.tenCuaHang ?? "Nhà sách"}</h1>
        <p className="mb-6 text-center text-sm text-gray-500">Đăng nhập hệ thống bán hàng</p>
        <FormDangNhap />
      </div>
    </main>
  );
}
