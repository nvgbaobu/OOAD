import type { Metadata } from "next";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { sachService } from "@/lib/services/sachService";
import FormSach from "../FormSach";

export const metadata: Metadata = { title: "Thêm sách" };

export default async function TrangThemSach() {
  await yeuCauDangNhap("ADMIN");
  const theLoais = await sachService.danhSachTheLoai();
  return (
    <div className="mx-auto max-w-3xl rounded-lg border bg-white p-5">
      <h1 className="mb-1 text-lg font-semibold">Thêm sách</h1>
      <p className="mb-4 text-sm text-gray-500">Sách mới có tồn kho = 0. Nhập hàng qua phiếu nhập (cần Admin duyệt).</p>
      <FormSach
        theLoais={theLoais.map((t) => ({ maTL: t.maTL, tenTL: t.tenTL, thueSuatVAT: Number(t.thueSuatVAT) }))}
        banDau={{ dinhMucToiThieu: "5" }}
      />
    </div>
  );
}
