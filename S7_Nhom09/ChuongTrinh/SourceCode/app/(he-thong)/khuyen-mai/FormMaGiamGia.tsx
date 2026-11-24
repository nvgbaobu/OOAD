"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { luuMaGiamGia } from "@/app/actions/khuyenMai";

const oNhap = "w-full rounded border px-2 py-1.5 text-sm aria-[invalid=true]:border-red-500";

/** Form thêm/sửa mã giảm giá (mẫu FormSach). khoaMaCode: mã đã dùng trong hóa đơn → không đổi maCode. */
export default function FormMaGiamGia({ banDau, maMGG, khoaMaCode }: { banDau: Record<string, string>; maMGG?: number; khoaMaCode?: boolean }) {
  const [state, action, pending] = useActionState(luuMaGiamGia, undefined);
  const gt = state?.duLieu ?? banDau;
  const loi = state?.loiTruong ?? {};
  const [loai, setLoai] = useState(gt.loaiGiam || "PHAN_TRAM");

  const o = (ten: string, nhan: string, props: React.InputHTMLAttributes<HTMLInputElement> & { batBuoc?: boolean; goiY?: string } = {}) => {
    const { batBuoc, goiY, ...conLai } = props;
    return (
      <label className="block text-sm">
        <span className="mb-1 block font-medium">{nhan}{batBuoc && <span className="text-red-600"> *</span>}</span>
        <input name={ten} defaultValue={gt[ten] ?? ""} aria-invalid={!!loi[ten]} className={oNhap} {...conLai} />
        {loi[ten] ? <span className="mt-0.5 block text-xs text-red-600">{loi[ten]}</span> : goiY && <span className="mt-0.5 block text-xs text-gray-500">{goiY}</span>}
      </label>
    );
  };

  return (
    <form action={action} key={JSON.stringify(gt)} className="space-y-4">
      {maMGG && <input type="hidden" name="maMGG" value={maMGG} />}
      {state?.loi && <p role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{state.loi}</p>}
      <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
        {o("maCode", "Mã", {
          batBuoc: true, placeholder: "VD: GIAM10", readOnly: khoaMaCode, className: `${oNhap} uppercase read-only:bg-gray-100`,
          goiY: khoaMaCode ? "Mã đã được dùng nên không đổi được" : "Khách nhập không phân biệt hoa/thường",
        })}
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Loại giảm<span className="text-red-600"> *</span></span>
          <select name="loaiGiam" defaultValue={gt.loaiGiam || "PHAN_TRAM"} onChange={(e) => setLoai(e.target.value)} aria-invalid={!!loi.loaiGiam} className={oNhap}>
            <option value="PHAN_TRAM">Giảm theo % (tính trên tiền sau ưu đãi hạng)</option>
            <option value="SO_TIEN">Giảm số tiền cố định</option>
          </select>
        </label>
        {o("giaTriGiam", loai === "PHAN_TRAM" ? "Giảm (%)" : "Giảm (đồng)", { batBuoc: true, type: "number", min: 0, step: loai === "PHAN_TRAM" ? 0.01 : 1 })}
        {o("giaTriDonToiThieu", "Đơn tối thiểu (đồng)", { type: "number", min: 0, step: 1, goiY: "Xét trên tiền sau combo; bỏ trống = 0" })}
        {o("soLuongToiDa", "Số lượt tối đa", { batBuoc: true, type: "number", min: 1 })}
        <div />
        {o("ngayBatDau", "Từ ngày", { batBuoc: true, type: "date" })}
        {o("ngayKetThuc", "Đến hết ngày", { batBuoc: true, type: "date" })}
      </fieldset>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
          {pending ? "Đang lưu..." : maMGG ? "Lưu thay đổi" : "Thêm mã"}
        </button>
        <Link href="/khuyen-mai" className="rounded border px-4 py-2 text-sm hover:bg-gray-50">Hủy</Link>
      </div>
    </form>
  );
}
