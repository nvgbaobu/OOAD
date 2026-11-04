"use client";

import { useActionState } from "react";
import type { KetQuaForm } from "@/lib/ketQuaForm";

const oNhap = "w-full rounded border px-2 py-1.5 text-sm aria-[invalid=true]:border-red-500";

/** Form đổi mật khẩu (cá nhân: có ô mật khẩu hiện tại) / đặt lại mật khẩu (Admin: truyền maTK). Không giữ lại mật khẩu khi lỗi. */
export default function FormMatKhau({ action, maTK, canMatKhauCu, tenDangNhap }: {
  action: (s: KetQuaForm, fd: FormData) => Promise<KetQuaForm>; maTK?: number; canMatKhauCu?: boolean;
  tenDangNhap: string; // ô ẩn autocomplete="username" – trình quản lý mật khẩu/trợ năng biết mật khẩu của tài khoản nào
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const loi = state?.loiTruong ?? {};
  const o = (ten: string, nhan: string) => (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{nhan}</span>
      <input type="password" name={ten} autoComplete={ten === "matKhauCu" ? "current-password" : "new-password"} required aria-invalid={!!loi[ten]} className={oNhap} />
      {loi[ten] && <span className="mt-0.5 block text-xs text-red-600">{loi[ten]}</span>}
    </label>
  );
  return (
    <form action={formAction} className="max-w-sm space-y-3">
      {maTK && <input type="hidden" name="maTK" value={maTK} />}
      <input type="text" name="tenDangNhap" autoComplete="username" value={tenDangNhap} readOnly hidden />
      {state?.thongBao && <p role="status" className="rounded bg-green-50 px-3 py-2 text-sm text-green-800">✔ {state.thongBao}</p>}
      {canMatKhauCu && o("matKhauCu", "Mật khẩu hiện tại")}
      {o("matKhauMoi", "Mật khẩu mới (tối thiểu 6 ký tự)")}
      {o("nhapLai", "Nhập lại mật khẩu mới")}
      <button disabled={pending} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
        {pending ? "Đang lưu..." : canMatKhauCu ? "Đổi mật khẩu" : "Đặt lại mật khẩu"}
      </button>
    </form>
  );
}
