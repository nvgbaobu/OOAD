import { redirect } from "next/navigation";
import { yeuCauDangNhap, trangChuTheoVaiTro } from "@/lib/auth/dal";

export default async function TrangGoc() {
  const nd = await yeuCauDangNhap();
  redirect(trangChuTheoVaiTro(nd.vaiTro));
}
