import type { Metadata } from "next";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { ngayInput } from "@/lib/dinhDang";
import FormMaGiamGia from "../../FormMaGiamGia";

export const metadata: Metadata = { title: "Thêm mã giảm giá" };

export default async function TrangThemMa() {
  await yeuCauDangNhap("ADMIN");
  const homNay = new Date();
  const sau30 = new Date(); sau30.setDate(sau30.getDate() + 30);
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <h1 className="text-lg font-semibold">Thêm mã giảm giá</h1>
      <div className="rounded-lg border bg-white p-4">
        <FormMaGiamGia banDau={{ loaiGiam: "PHAN_TRAM", soLuongToiDa: "100", ngayBatDau: ngayInput(homNay), ngayKetThuc: ngayInput(sau30) }} />
      </div>
    </div>
  );
}
