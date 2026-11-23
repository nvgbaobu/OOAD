"use client";

import { useActionState } from "react";
import { luuCauHinh } from "@/app/actions/caiDat";

const oNhap = "w-full rounded border px-2 py-1.5 text-sm aria-[invalid=true]:border-red-500";

/** Form cấu hình (mẫu FormSach). banDau: chuỗi; checkbox: "on" | "". */
export default function FormCauHinh({ banDau }: { banDau: Record<string, string> }) {
  const [state, action, pending] = useActionState(luuCauHinh, undefined);
  const gt = state?.duLieu ? { ttTienMat: "", ttQuetThe: "", ttMaQR: "", ...state.duLieu } : banDau;
  const loi = state?.loiTruong ?? {};
  const o = (ten: string, nhan: string, props: React.InputHTMLAttributes<HTMLInputElement> & { goiY?: string } = {}) => {
    const { goiY, ...conLai } = props;
    return (
      <label className="block text-sm">
        <span className="mb-1 block font-medium">{nhan}</span>
        <input name={ten} defaultValue={gt[ten] ?? ""} aria-invalid={!!loi[ten]} className={oNhap} {...conLai} />
        {loi[ten] ? <span className="mt-0.5 block text-xs text-red-600">{loi[ten]}</span> : goiY && <span className="mt-0.5 block text-xs text-gray-500">{goiY}</span>}
      </label>
    );
  };
  const hop = (ten: string, nhan: string) => (
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" name={ten} defaultChecked={gt[ten] === "on"} /> {nhan}</label>
  );

  return (
    <form action={action} key={JSON.stringify(gt)} className="space-y-4">
      {state?.loi && <p role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{state.loi}</p>}
      <fieldset disabled={pending} className="space-y-4">
        <section className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">Thông tin cửa hàng <span className="font-normal text-gray-500">(in trên hóa đơn)</span></h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">{o("tenCuaHang", "Tên cửa hàng *")}</div>
            <div className="sm:col-span-2">{o("diaChi", "Địa chỉ")}</div>
            {o("soDienThoai", "Số điện thoại", { inputMode: "tel" })}
            {o("maSoThue", "Mã số thuế")}
            <div className="sm:col-span-2">{o("logo", "Logo (đường dẫn ảnh)", { placeholder: "https://... hoặc /logo.png", goiY: "Bỏ trống nếu không in logo" })}</div>
          </div>
        </section>
        <section className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">Tích điểm thành viên</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {o("tyLeQuyDoiDiem", "Số tiền để được 1 điểm (đồng) *", { type: "number", min: 1000, step: 1, goiY: "Điểm cộng = tổng tiền hóa đơn ÷ số này (làm tròn xuống)" })}
            {o("giaTriMotDiem", "Giá trị 1 điểm khi đổi (đồng) *", { type: "number", min: 1, step: 1 })}
          </div>
        </section>
        <section className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">Phương thức thanh toán ở quầy</h2>
          <div className="flex flex-wrap gap-6">{hop("ttTienMat", "Tiền mặt")}{hop("ttQuetThe", "Quẹt thẻ")}{hop("ttMaQR", "Mã QR")}</div>
          {loi.phuongThuc && <p className="mt-1 text-xs text-red-600">{loi.phuongThuc}</p>}
        </section>
      </fieldset>
      <button disabled={pending} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
        {pending ? "Đang lưu..." : "Lưu cài đặt"}
      </button>
    </form>
  );
}
