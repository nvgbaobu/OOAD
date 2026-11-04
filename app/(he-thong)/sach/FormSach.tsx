"use client";

import Link from "next/link";
import { useActionState } from "react";
import { luuSach } from "@/app/actions/sach";

type TheLoai = { maTL: number; tenTL: string; thueSuatVAT: number };

const oNhap = "w-full rounded border px-2 py-1.5 text-sm aria-[invalid=true]:border-red-500";

/** Form thêm/sửa sách. Lỗi hiện dưới từng ô; khi lỗi, form giữ lại giá trị vừa nhập. */
export default function FormSach({ theLoais, banDau, maSach }: { theLoais: TheLoai[]; banDau: Record<string, string>; maSach?: number }) {
  const [state, action, pending] = useActionState(luuSach, undefined);
  const gt = state?.duLieu ?? banDau;
  const loi = state?.loiTruong ?? {};

  // Hàm trả JSX (không phải component) để không tạo component mới mỗi lần render
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
      {maSach && <input type="hidden" name="maSach" value={maSach} />}
      {state?.loi && <p role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{state.loi}</p>}

      <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
        {o("isbn", "ISBN", { batBuoc: true, placeholder: "10 hoặc 13 chữ số", inputMode: "numeric" })}
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Thể loại<span className="text-red-600"> *</span></span>
          <select name="maTL" defaultValue={gt.maTL ?? ""} aria-invalid={!!loi.maTL} className={oNhap}>
            <option value="">— Chọn thể loại —</option>
            {theLoais.map((t) => (
              <option key={t.maTL} value={t.maTL}>{t.tenTL} (VAT {t.thueSuatVAT}%)</option>
            ))}
          </select>
          {loi.maTL && <span className="mt-0.5 block text-xs text-red-600">{loi.maTL}</span>}
        </label>
        <div className="sm:col-span-2">{o("tenSach", "Tên sách", { batBuoc: true })}</div>
        {o("tacGia", "Tác giả", { batBuoc: true })}
        {o("nhaXuatBan", "Nhà xuất bản")}
        {o("namXB", "Năm xuất bản", { type: "number", min: 1900 })}
        {o("viTriKe", "Vị trí kệ", { placeholder: "VD: A1-01" })}
        {o("giaNhap", "Giá nhập (đ)", { batBuoc: true, type: "number", min: 0, step: 500 })}
        {o("giaBan", "Giá bán (đ)", { batBuoc: true, type: "number", min: 0, step: 500 })}
        {o("dinhMucToiThieu", "Định mức tồn tối thiểu", { type: "number", min: 0 })}
        {o("hinhAnh", "Đường dẫn ảnh bìa", { placeholder: "https://..." })}
      </fieldset>

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
          {pending ? "Đang lưu..." : maSach ? "Lưu thay đổi" : "Thêm sách"}
        </button>
        <Link href="/sach" className="rounded border px-4 py-2 text-sm hover:bg-gray-50">Hủy</Link>
      </div>
    </form>
  );
}
