import Link from "next/link";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { dangXuat } from "@/app/actions/auth";

// Khung chung cho các trang sau đăng nhập. Mỗi page vẫn tự gọi yeuCauDangNhap(<vai trò>) để kiểm quyền.
export default async function LayoutHeThong({ children }: LayoutProps<"/">) {
  const nd = await yeuCauDangNhap();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center gap-4 border-b bg-white px-4 py-2">
        <span className="font-bold">Nhà sách</span>
        <nav className="flex gap-3 text-sm">
          {nd.vaiTro === "ADMIN" && <Link href="/dashboard" className="hover:underline">Dashboard</Link>}
          <Link href="/pos" className="hover:underline">Bán hàng</Link>
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span>
            {nd.hoTen} <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">{nd.vaiTro === "ADMIN" ? "Quản trị" : "Nhân viên"}</span>
          </span>
          <form action={dangXuat}>
            <button type="submit" className="rounded border px-2 py-1 hover:bg-gray-50">Đăng xuất</button>
          </form>
        </div>
      </header>
      <main className="flex-1 bg-gray-50 p-4">{children}</main>
    </div>
  );
}
