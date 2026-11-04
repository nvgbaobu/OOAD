"use client";

import Link from "next/link";
import { useActionState } from "react";
import { luuTaiKhoan } from "@/app/actions/caiDat";

const oNhap = "w-full rounded border px-2 py-1.5 text-sm aria-[invalid=true]:border-red-500 read-only:bg-gray-100";

/** Form thêm / sửa tài khoản. Sửa: SĐT (tên đăng nhập) chỉ đọc, không có ô mật khẩu (đặt lại ở khối riêng). */
export default function FormTaiKhoan({ banDau, maTK }: { banDau: Record<string, string>; maTK?: number }) {
  const [state, action, pending] = useActionState(luuTaiKhoan, undefined);
  const gt = state?.duLieu ?? banDau;
  const loi = state?.loiTruong ?? {};
  const o = (ten: string, nhan: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{nhan}</span>
      <input name={ten} defaultValue={props.type === "password" ? undefined : gt[ten] ?? ""} aria-invalid={!!loi[ten]} className={oNhap} {...props} />
      {loi[ten] && <span className="mt-0.5 block text-xs text-red-600">{loi[ten]}</span>}
    </label>
  );
  return (
    <form action={action} key={JSON.stringify(gt)} className="space-y-4">
      {maTK && <input type="hidden" name="maTK" value={maTK} />}
      {state?.loi && <p role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{state.loi}</p>}
      <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
        {o("soDienThoai", "Số điện thoại (tên đăng nhập) *", { readOnly: !!maTK, inputMode: "tel", autoComplete: maTK ? "off" : "username" })}
        {o("hoTen", "Họ tên *")}
        {o("email", "Email", { type: "email" })}
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Vai trò *</span>
          <select name="vaiTro" defaultValue={gt.vaiTro || "STAFF"} aria-invalid={!!loi.vaiTro} className={oNhap}>
            <option value="STAFF">Nhân viên – bán hàng, lập phiếu kho</option>
            <option value="ADMIN">Quản trị – toàn quyền</option>
          </select>
          {loi.vaiTro && <span className="mt-0.5 block text-xs text-red-600">{loi.vaiTro}</span>}
        </label>
        {!maTK && o("matKhau", "Mật khẩu ban đầu * (tối thiểu 6 ký tự)", { type: "password", autoComplete: "new-password" })}
      </fieldset>
      <div className="flex gap-2">
        <button disabled={pending} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
          {pending ? "Đang lưu..." : maTK ? "Lưu thay đổi" : "Tạo tài khoản"}
        </button>
        {maTK && <Link href="/cai-dat/tai-khoan" className="rounded border px-4 py-2 text-sm hover:bg-gray-50">Quay lại</Link>}
      </div>
    </form>
  );
}
