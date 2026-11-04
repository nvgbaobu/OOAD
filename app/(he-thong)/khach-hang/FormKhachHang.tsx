"use client";

import Link from "next/link";
import { useActionState } from "react";
import { luuKhachHang } from "@/app/actions/khachHang";

const oNhap = "w-full rounded border px-2 py-1.5 text-sm aria-[invalid=true]:border-red-500";

/** Form thêm/sửa thông tin khách (mẫu FormSach: lỗi dưới từng ô, giữ dữ liệu khi lỗi). Điểm không sửa ở đây. */
export default function FormKhachHang({ banDau, maKH }: { banDau: Record<string, string>; maKH?: number }) {
  const [state, action, pending] = useActionState(luuKhachHang, undefined);
  const gt = state?.duLieu ?? banDau;
  const loi = state?.loiTruong ?? {};

  const o = (ten: string, nhan: string, props: React.InputHTMLAttributes<HTMLInputElement> & { batBuoc?: boolean } = {}) => {
    const { batBuoc, ...conLai } = props;
    return (
      <label className="block text-sm">
        <span className="mb-1 block font-medium">{nhan}{batBuoc && <span className="text-red-600"> *</span>}</span>
        <input name={ten} defaultValue={gt[ten] ?? ""} aria-invalid={!!loi[ten]} className={oNhap} {...conLai} />
        {loi[ten] && <span className="mt-0.5 block text-xs text-red-600">{loi[ten]}</span>}
      </label>
    );
  };

  return (
    <form action={action} key={JSON.stringify(gt)} className="space-y-4">
      {maKH && <input type="hidden" name="maKH" value={maKH} />}
      {state?.loi && <p role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{state.loi}</p>}
      <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
        {o("soDienThoai", "Số điện thoại", { batBuoc: true, inputMode: "tel", placeholder: "10 số, bắt đầu bằng 0" })}
        {o("hoTen", "Họ tên", { batBuoc: true })}
        {o("email", "Email", { type: "email" })}
        {o("diaChi", "Địa chỉ")}
      </fieldset>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
          {pending ? "Đang lưu..." : maKH ? "Lưu thay đổi" : "Thêm khách hàng"}
        </button>
        <Link href="/khach-hang" className="rounded border px-4 py-2 text-sm hover:bg-gray-50">Hủy</Link>
      </div>
    </form>
  );
}
