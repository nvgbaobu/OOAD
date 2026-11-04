import { yeuCauDangNhap } from "@/lib/auth/dal";

// TODO(module 9): Dashboard + báo cáo doanh thu
export default async function TrangDashboard() {
  const nd = await yeuCauDangNhap("ADMIN");
  return <h1 className="text-lg font-semibold">Dashboard – Xin chào {nd.hoTen}</h1>;
}
