"use client";

import { useActionState, type ReactNode } from "react";
import type { KetQuaForm } from "@/lib/ketQuaForm";

/** Form phục hồi CSDL (UC10.4): hỏi lại trước khi ghi đè, hiện lỗi hoặc thông báo thành công. */
export default function FormPhucHoi({
  action, xacNhan, children, className,
}: {
  action: (s: KetQuaForm, fd: FormData) => Promise<KetQuaForm>;
  xacNhan: string;
  children: ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className={className} onSubmit={(e) => { if (!confirm(xacNhan)) e.preventDefault(); }}>
      <fieldset disabled={pending} className="contents">{children}</fieldset>
      {pending && <p className="basis-full text-sm [overflow-wrap:anywhere] text-blue-700">Đang phục hồi… không tắt trang.</p>}
      {state?.loi && <p role="alert" className="basis-full text-sm [overflow-wrap:anywhere] text-red-600">{state.loi}</p>}
      {state?.thongBao && <p role="status" className="basis-full text-sm [overflow-wrap:anywhere] text-green-700">✓ {state.thongBao}</p>}
    </form>
  );
}
