import type { Metadata } from "next";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { khoService } from "@/lib/services/khoService";
import { lapPhieu } from "@/app/actions/kho";
import FormPhieuKho from "../../FormPhieuKho";

export const metadata: Metadata = { title: "Lập phiếu kiểm kê" };

export default async function TrangLapKiemKe() {
  await yeuCauDangNhap("ADMIN", "STAFF");
  const sachs = await khoService.sachDeChon();
  return (
    <div className="mx-auto max-w-5xl space-y-3">
      <h1 className="text-lg font-semibold">Lập phiếu kiểm kê</h1>
      <p className="rounded bg-blue-50 p-3 text-sm text-blue-900">
        Đếm sách thực tế trên kệ rồi nhập vào cột <b>SL thực tế</b>. Dòng nào lệch với tồn hệ thống phải ghi lý do.
        Tồn kho chỉ được điều chỉnh (cộng/trừ phần chênh lệch) sau khi Admin duyệt phiếu.
      </p>
      <FormPhieuKho loai="kiem-ke" sachs={sachs} action={lapPhieu.bind(null, "kiem-ke")} />
    </div>
  );
}
