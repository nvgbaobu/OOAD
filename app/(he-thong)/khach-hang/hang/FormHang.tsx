"use client";

import { useActionState } from "react";
import { luuHang } from "@/app/actions/khachHang";

const oNhap = "rounded border px-2 py-1 text-sm aria-[invalid=true]:border-red-500";

/** Một dòng thêm/sửa hạng thành viên. Giữ giá trị đã nhập khi lỗi (duLieu). */
export default function FormHang({ banDau, maHang }: { banDau: Record<string, string>; maHang?: number }) {
  const [state, action, pending] = useActionState(luuHang, undefined);
  const gt = state?.duLieu ?? banDau;
  const loi = state?.loiTruong ?? {};
  return (
    <form action={action} key={JSON.stringify(gt)} className="flex flex-1 flex-wrap items-start gap-2">
      {maHang && <input type="hidden" name="maHang" value={maHang} />}
      <fieldset disabled={pending} className="contents">
        <input name="tenHang" defaultValue={gt.tenHang} placeholder="Tên hạng" aria-label="Tên hạng" aria-invalid={!!loi.tenHang} className={`${oNhap} w-36`} />
        <label className="flex items-center gap-1 text-sm">từ
          <input name="diemToiThieu" type="number" min={0} defaultValue={gt.diemToiThieu} aria-label="Điểm tối thiểu" aria-invalid={!!loi.diemToiThieu} className={`${oNhap} w-24`} />
          điểm tích lũy
        </label>
        <label className="flex items-center gap-1 text-sm">ưu đãi
          <input name="phanTramUuDai" type="number" min={0} max={50} step={0.5} defaultValue={gt.phanTramUuDai} aria-label="Phần trăm ưu đãi" aria-invalid={!!loi.phanTramUuDai} className={`${oNhap} w-20`} />%
        </label>
        <button className={`rounded px-3 py-1 text-sm ${maHang ? "border hover:bg-gray-50" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
          {pending ? "..." : maHang ? "Lưu" : "Thêm"}
        </button>
      </fieldset>
      {state?.loi && <p role="alert" className="basis-full text-xs text-red-600">{state.loi}</p>}
    </form>
  );
}
