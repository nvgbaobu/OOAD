import type { Metadata } from "next";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { khoService } from "@/lib/services/khoService";
import { lapPhieu } from "@/app/actions/kho";
import FormPhieuKho from "../../FormPhieuKho";

export const metadata: Metadata = { title: "Lập phiếu xuất hủy" };

export default async function TrangLapXuatHuy() {
  await yeuCauDangNhap("ADMIN", "STAFF");
  const sachs = await khoService.sachDeChon();
  return (
    <div className="mx-auto max-w-5xl space-y-3">
      <h1 className="text-lg font-semibold">Lập phiếu xuất hủy</h1>
      <p className="rounded bg-blue-50 p-3 text-sm text-blue-900">
        Dùng cho sách hư hỏng, rách, ẩm mốc... không bán được. Số lượng hủy không vượt quá số đang có thể bán
        (tồn kho − tạm giữ). Kho chỉ bị trừ sau khi Admin duyệt phiếu.
      </p>
      <FormPhieuKho loai="xuat-huy" sachs={sachs} action={lapPhieu.bind(null, "xuat-huy")} />
    </div>
  );
}
