import { yeuCauDangNhap } from "@/lib/auth/dal";

// TODO(module 2): màn hình POS bán hàng
export default async function TrangPOS() {
  const nd = await yeuCauDangNhap("ADMIN", "STAFF");
  return <h1 className="text-lg font-semibold">Bán hàng (POS) – Thu ngân: {nd.hoTen}</h1>;
}
