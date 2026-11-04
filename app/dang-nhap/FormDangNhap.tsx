"use client";

import { useActionState } from "react";
import { dangNhap } from "@/app/actions/auth";

export default function FormDangNhap() {
  const [state, action, pending] = useActionState(dangNhap, undefined);

  return (
    <form action={action} className="space-y-4" noValidate>
      {state?.loi && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.loi}
        </p>
      )}

      <div>
        <label htmlFor="soDienThoai" className="mb-1 block text-sm font-medium">Số điện thoại</label>
        <input
          id="soDienThoai" name="soDienThoai" type="tel" inputMode="numeric" autoComplete="username" autoFocus
          defaultValue={state?.soDienThoai} placeholder="VD: 0900000001"
          className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-600"
        />
        {state?.loiTruong?.soDienThoai && <p className="mt-1 text-sm text-red-600">{state.loiTruong.soDienThoai}</p>}
      </div>

      <div>
        <label htmlFor="matKhau" className="mb-1 block text-sm font-medium">Mật khẩu</label>
        <input
          id="matKhau" name="matKhau" type="password" autoComplete="current-password"
          className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-600"
        />
        {state?.loiTruong?.matKhau && <p className="mt-1 text-sm text-red-600">{state.loiTruong.matKhau}</p>}
      </div>

      <button
        type="submit" disabled={pending}
        className="w-full rounded bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {pending ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
    </form>
  );
}
