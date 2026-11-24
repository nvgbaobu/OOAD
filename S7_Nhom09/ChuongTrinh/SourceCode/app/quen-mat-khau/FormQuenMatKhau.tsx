"use client";

import Link from "next/link";
import { useActionState } from "react";
import { datLaiMatKhauOTP, xacNhanOTP, yeuCauOTP, type KetQuaQuenMatKhau } from "@/app/actions/auth";

/** Hàm action của form bước 1 (từ useActionState) – dùng lại cho nút "Gửi lại mã". */
type HanhDong = (fd: FormData) => void;

const oNhap = "w-full rounded border px-3 py-2 aria-[invalid=true]:border-red-500";
const nutChinh = "w-full rounded bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60";
const gioPhut = (iso: string) => new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

function ThongBaoLoi({ state }: { state: KetQuaQuenMatKhau }) {
  return state?.loi ? <p role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{state.loi}</p> : null;
}

/** Nút "Gửi lại mã": gửi lại form bước 1 với SĐT đã nhập → cấp OTP mới (mã cũ bị vô hiệu). */
function NutGuiLai({ guiLai, soDienThoai, noiBat }: { guiLai: HanhDong; soDienThoai: string; noiBat?: boolean }) {
  return (
    <form action={guiLai}>
      <input type="hidden" name="soDienThoai" value={soDienThoai} />
      <button className={noiBat ? "w-full rounded border border-blue-600 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50" : "text-sm text-blue-600 hover:underline"}>
        Gửi lại mã
      </button>
    </form>
  );
}

/** Bước 3 – đặt mật khẩu mới. */
function BuocMatKhau({ soDienThoai, maCode, guiLai }: { soDienThoai: string; maCode: string; guiLai: HanhDong }) {
  const [state, action, pending] = useActionState(datLaiMatKhauOTP, undefined);
  if (state?.ok) {
    return (
      <div className="space-y-4 text-center">
        <p role="status" className="rounded bg-green-50 px-3 py-3 text-sm text-green-800">✔ Đặt lại mật khẩu thành công. Hãy đăng nhập bằng mật khẩu mới.</p>
        <Link href="/dang-nhap" className={`${nutChinh} block`}>Về trang Đăng nhập</Link>
      </div>
    );
  }
  const loi = state?.loiTruong ?? {};
  return (
    <div className="space-y-3">
      <form action={action} className="space-y-4">
        <input type="hidden" name="soDienThoai" value={soDienThoai} />
        <input type="hidden" name="maCode" value={maCode} />
        <input type="text" name="tenDangNhap" autoComplete="username" value={soDienThoai} readOnly hidden />
        <ThongBaoLoi state={state} />
        <div>
          <label htmlFor="matKhauMoi" className="mb-1 block text-sm font-medium">Mật khẩu mới (6–72 ký tự)</label>
          <input id="matKhauMoi" name="matKhauMoi" type="password" autoComplete="new-password" required aria-invalid={!!loi.matKhauMoi} className={oNhap} />
          {loi.matKhauMoi && <p className="mt-1 text-sm text-red-600">{loi.matKhauMoi}</p>}
        </div>
        <div>
          <label htmlFor="nhapLai" className="mb-1 block text-sm font-medium">Nhập lại mật khẩu mới</label>
          <input id="nhapLai" name="nhapLai" type="password" autoComplete="new-password" required aria-invalid={!!loi.nhapLai} className={oNhap} />
          {loi.nhapLai && <p className="mt-1 text-sm text-red-600">{loi.nhapLai}</p>}
        </div>
        <button disabled={pending} className={nutChinh}>{pending ? "Đang lưu..." : "Đặt lại mật khẩu"}</button>
      </form>
      {loi.hetHan && <NutGuiLai guiLai={guiLai} soDienThoai={soDienThoai} noiBat />}
    </div>
  );
}

/** Bước 2 – hiện "SMS giả lập" và nhập OTP. key = lần cấp mã → gửi lại mã thì form làm mới, xóa lỗi cũ. */
function BuocOTP({ soDienThoai, sms, guiLai }: { soDienThoai: string; sms: { maCode: string; hetHanLuc: string }; guiLai: HanhDong }) {
  const [state, action, pending] = useActionState(xacNhanOTP, undefined);
  if (state?.ok && state.maCode) return <BuocMatKhau soDienThoai={soDienThoai} maCode={state.maCode} guiLai={guiLai} />;
  const loi = state?.loiTruong ?? {};
  return (
    <div className="space-y-4">
      <p role="status" className="rounded border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-900">
        📱 SMS giả lập tới {soDienThoai}: mã OTP của bạn là <b className="font-mono text-base tracking-widest">{sms.maCode}</b> (hết hạn lúc {gioPhut(sms.hetHanLuc)})
      </p>
      <form action={action} className="space-y-4" noValidate>
        <input type="hidden" name="soDienThoai" value={soDienThoai} />
        <ThongBaoLoi state={state} />
        <div>
          <label htmlFor="maCode" className="mb-1 block text-sm font-medium">Mã OTP (6 số)</label>
          <input id="maCode" name="maCode" inputMode="numeric" autoComplete="one-time-code" maxLength={6} defaultValue={state?.duLieu?.maCode}
            aria-invalid={!!loi.maCode} className={`${oNhap} font-mono tracking-widest`} />
          {loi.maCode && <p className="mt-1 text-sm text-red-600">{loi.maCode}</p>}
        </div>
        <button disabled={pending} className={nutChinh}>{pending ? "Đang kiểm tra..." : "Xác nhận"}</button>
      </form>
      <div className="text-center"><NutGuiLai guiLai={guiLai} soDienThoai={soDienThoai} noiBat={!!loi.hetHan} /></div>
    </div>
  );
}

/** UC1.4 – Bước 1 nhập SĐT; các bước sau hiện khi bước trước thành công. */
export default function FormQuenMatKhau() {
  const [state, action, pending] = useActionState(yeuCauOTP, undefined);
  if (state?.ok && state.soDienThoai && state.sms) {
    return (
      <div className="space-y-4">
        <BuocOTP key={state.sms.hetHanLuc} soDienThoai={state.soDienThoai} sms={state.sms} guiLai={action} />
        {pending && <p className="text-center text-sm text-gray-500">Đang gửi lại mã...</p>}
        <p className="text-center text-sm"><Link href="/dang-nhap" className="text-gray-600 hover:underline">← Quay lại Đăng nhập</Link></p>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4" noValidate>
      <ThongBaoLoi state={state} />
      <div>
        <label htmlFor="soDienThoai" className="mb-1 block text-sm font-medium">Số điện thoại đăng nhập</label>
        <input id="soDienThoai" name="soDienThoai" type="tel" inputMode="numeric" autoComplete="username" placeholder="0900000002"
          defaultValue={state?.duLieu?.soDienThoai} aria-invalid={!!state?.loiTruong?.soDienThoai} className={oNhap} />
      </div>
      <button disabled={pending} className={nutChinh}>{pending ? "Đang gửi mã..." : "Gửi mã OTP"}</button>
      <p className="text-center text-sm"><Link href="/dang-nhap" className="text-gray-600 hover:underline">← Quay lại Đăng nhập</Link></p>
    </form>
  );
}
