"use client";

import { useActionState, type ReactNode } from "react";

type KetQua = { loi?: string } | undefined;

/** Form gọi server action, tự khóa khi đang xử lý và hiện lỗi nghiệp vụ trả về ({ loi }). */
export default function FormHanhDong({
  action, children, className, xacNhan,
}: {
  action: (state: KetQua, fd: FormData) => Promise<KetQua>;
  children: ReactNode;
  className?: string;
  xacNhan?: string; // hỏi lại trước khi gửi
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form
      action={formAction}
      className={className}
      onSubmit={xacNhan ? (e) => { if (!confirm(xacNhan)) e.preventDefault(); } : undefined}
    >
      <fieldset disabled={pending} className="contents">{children}</fieldset>
      {state?.loi && <p role="alert" className="basis-full text-sm text-red-600">{state.loi}</p>}
    </form>
  );
}
