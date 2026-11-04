import type { Metadata } from "next";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { caiDatService } from "@/lib/services/caiDatService";
import FormCauHinh from "./FormCauHinh";

export const metadata: Metadata = { title: "Cài đặt" };

export default async function TrangCaiDat({ searchParams }: PageProps<"/cai-dat">) {
  await yeuCauDangNhap("ADMIN");
  const [ch, sp] = await Promise.all([caiDatService.layCauHinh(), searchParams]);
  const banDau = {
    tenCuaHang: ch.tenCuaHang, diaChi: ch.diaChi ?? "", soDienThoai: ch.soDienThoai ?? "", maSoThue: ch.maSoThue ?? "", logo: ch.logo ?? "",
    tyLeQuyDoiDiem: String(Number(ch.tyLeQuyDoiDiem)), giaTriMotDiem: String(Number(ch.giaTriMotDiem)),
    ttTienMat: ch.ttTienMat ? "on" : "", ttQuetThe: ch.ttQuetThe ? "on" : "", ttMaQR: ch.ttMaQR ? "on" : "",
  };
  return (
    <div className="max-w-3xl space-y-3">
      {sp.daLuu === "1" && <p role="status" className="rounded bg-green-50 px-3 py-2 text-sm text-green-800">✔ Đã lưu cài đặt. Áp dụng ngay cho đơn chưa thanh toán.</p>}
      <FormCauHinh banDau={banDau} />
    </div>
  );
}
