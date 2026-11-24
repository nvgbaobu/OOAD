import type { Metadata } from "next";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import FormNhaCungCap from "../FormNhaCungCap";

export const metadata: Metadata = { title: "Thêm nhà cung cấp" };

export default async function TrangThemNhaCungCap() {
  await yeuCauDangNhap("ADMIN");
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <h1 className="text-lg font-semibold">Thêm nhà cung cấp</h1>
      <div className="rounded-lg border bg-white p-4"><FormNhaCungCap banDau={{}} /></div>
    </div>
  );
}
