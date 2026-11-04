import Link from "next/link";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { posService } from "@/lib/services/posService";
import NutDangXuat from "./NutDangXuat";

// Khung chung cho các trang sau đăng nhập. Mỗi page vẫn tự gọi yeuCauDangNhap(<vai trò>) để kiểm quyền.
export default async function LayoutHeThong({ children }: LayoutProps<"/">) {
  const nd = await yeuCauDangNhap();
  const soSachDangLap = await posService.soSachDonDangLap(nd.maTK);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center print:hidden gap-4 border-b bg-white px-4 py-2">
        <span className="font-bold">Nhà sách</span>
        <nav className="flex gap-3 text-sm">
          {nd.vaiTro === "ADMIN" && <Link href="/dashboard" className="hover:underline">Dashboard</Link>}
          <Link href="/pos" className="hover:underline">Bán hàng</Link>
          <Link href="/hoa-don" className="hover:underline">Hóa đơn</Link>
          <Link href="/khach-hang" className="hover:underline">Khách hàng</Link>
          <Link href="/sach" className="hover:underline">Sách</Link>
          <Link href="/kho" className="hover:underline">Kho</Link>
          {nd.vaiTro === "ADMIN" && <Link href="/nha-cung-cap" className="hover:underline">Nhà cung cấp</Link>}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span>
            {nd.hoTen} <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">{nd.vaiTro === "ADMIN" ? "Quản trị" : "Nhân viên"}</span>
          </span>
          <NutDangXuat soSachDangLap={soSachDangLap} />
        </div>
      </header>
      <main className="flex-1 bg-gray-50 p-4 print:bg-white print:p-0">{children}</main>
    </div>
  );
}
