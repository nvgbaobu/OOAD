import type { Metadata } from "next";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { doiMatKhau } from "@/app/actions/caiDat";
import FormMatKhau from "@/app/components/FormMatKhau";
import { TEN_VAI_TRO } from "@/lib/services/taiKhoanService";

export const metadata: Metadata = { title: "Tài khoản của tôi" };

export default async function TrangCaNhan() {
  const nd = await yeuCauDangNhap("ADMIN", "STAFF");
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-lg font-semibold">Tài khoản của tôi</h1>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg border bg-white p-4 text-sm">
        <dt className="text-gray-500">Họ tên</dt><dd>{nd.hoTen}</dd>
        <dt className="text-gray-500">Tên đăng nhập</dt><dd>{nd.soDienThoai}</dd>
        <dt className="text-gray-500">Vai trò</dt><dd>{TEN_VAI_TRO[nd.vaiTro]}</dd>
      </dl>
      <section className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">Đổi mật khẩu</h2>
        <FormMatKhau action={doiMatKhau} canMatKhauCu tenDangNhap={nd.soDienThoai} />
      </section>
      <p className="text-xs text-gray-500">Quên mật khẩu? Nhờ quản trị viên đặt lại ở Cài đặt → Tài khoản.</p>
    </div>
  );
}
