import type { Metadata } from "next";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import FormKhachHang from "../FormKhachHang";

export const metadata: Metadata = { title: "Thêm khách hàng" };

export default async function TrangThemKhachHang() {
  await yeuCauDangNhap("ADMIN", "STAFF");
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <h1 className="text-lg font-semibold">Thêm khách hàng thành viên</h1>
      <p className="text-sm text-gray-600">Khách mới được xếp hạng thấp nhất, 0 điểm. Điểm được cộng tự động khi thanh toán.</p>
      <div className="rounded-lg border bg-white p-4"><FormKhachHang banDau={{}} /></div>
    </div>
  );
}
