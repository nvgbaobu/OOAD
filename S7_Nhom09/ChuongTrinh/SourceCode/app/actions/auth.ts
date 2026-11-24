"use server";

import { redirect } from "next/navigation";
import { authService } from "@/lib/services/authService";
import { taoPhien, xoaPhien } from "@/lib/auth/session";
import { layNguoiDung, trangChuTheoVaiTro } from "@/lib/auth/dal";
import { posService } from "@/lib/services/posService";
import { matKhauService } from "@/lib/services/matKhauService";
import { batLoiNghiepVu, type KetQuaForm } from "@/lib/ketQuaForm";

export type TrangThaiFormDangNhap = {
  loi?: string;
  loiTruong?: { soDienThoai?: string; matKhau?: string };
  soDienThoai?: string;
} | undefined;

export async function dangNhap(_: TrangThaiFormDangNhap, formData: FormData): Promise<TrangThaiFormDangNhap> {
  const soDienThoai = String(formData.get("soDienThoai") ?? "").trim();
  const matKhau = String(formData.get("matKhau") ?? "");

  const loiTruong: NonNullable<TrangThaiFormDangNhap>["loiTruong"] = {};
  if (!soDienThoai) loiTruong.soDienThoai = "Vui lòng nhập số điện thoại";
  else if (!/^0\d{9}$/.test(soDienThoai)) loiTruong.soDienThoai = "Số điện thoại gồm 10 chữ số, bắt đầu bằng 0";
  if (!matKhau) loiTruong.matKhau = "Vui lòng nhập mật khẩu";
  if (loiTruong.soDienThoai || loiTruong.matKhau) return { loiTruong, soDienThoai };

  const kq = await authService.dangNhap(soDienThoai, matKhau);
  if (!kq.ok) return { loi: kq.loi, soDienThoai };

  await taoPhien({ maTK: kq.maTK, vaiTro: kq.vaiTro });
  redirect(trangChuTheoVaiTro(kq.vaiTro)); // redirect phải nằm ngoài try/catch
}

export async function dangXuat() {
  const nd = await layNguoiDung();
  if (nd) {
    await posService.huyDonKhiDangXuat(nd.maTK); // UC1.2: đơn nháp bị hủy, giải phóng tạm giữ
    await authService.dangXuat(nd.maTK);
  }
  await xoaPhien();
  redirect("/dang-nhap");
}

// ───────── UC1.4 Khôi phục mật khẩu bằng OTP (không cần đăng nhập) ─────────

/** Kết quả từng bước quên mật khẩu. ok = bước thành công; sms = OTP giả lập để hiển thị. */
export type KetQuaQuenMatKhau =
  | (NonNullable<KetQuaForm> & { ok?: boolean; soDienThoai?: string; maCode?: string; sms?: { maCode: string; hetHanLuc: string } })
  | undefined;

const chuoi = (fd: FormData, k: string) => String(fd.get(k) ?? "");

/** Bước 1 (và "Gửi lại mã"): cấp OTP mới. */
export async function yeuCauOTP(_: KetQuaQuenMatKhau, fd: FormData): Promise<KetQuaQuenMatKhau> {
  const soDienThoai = chuoi(fd, "soDienThoai");
  let sms: { maCode: string; hetHanLuc: string; soDienThoai: string } | undefined;
  const kq = await batLoiNghiepVu(async () => {
    const r = await matKhauService.yeuCauOTP(soDienThoai);
    sms = { maCode: r.maCode, hetHanLuc: r.hetHanLuc.toISOString(), soDienThoai: r.soDienThoai };
  }, { soDienThoai });
  if (kq || !sms) return kq;
  return { ok: true, soDienThoai: sms.soDienThoai, sms: { maCode: sms.maCode, hetHanLuc: sms.hetHanLuc } };
}

/** Bước 2: xác nhận OTP. */
export async function xacNhanOTP(_: KetQuaQuenMatKhau, fd: FormData): Promise<KetQuaQuenMatKhau> {
  const soDienThoai = chuoi(fd, "soDienThoai");
  const maCode = chuoi(fd, "maCode").trim();
  const kq = await batLoiNghiepVu(() => matKhauService.xacNhanOTP(soDienThoai, maCode), { maCode });
  return kq ?? { ok: true, soDienThoai, maCode };
}

/** Bước 3: đặt mật khẩu mới (kiểm tra lại OTP). Không trả mật khẩu về form. */
export async function datLaiMatKhauOTP(_: KetQuaQuenMatKhau, fd: FormData): Promise<KetQuaQuenMatKhau> {
  const kq = await batLoiNghiepVu(() =>
    matKhauService.datLaiMatKhau(chuoi(fd, "soDienThoai"), chuoi(fd, "maCode"), chuoi(fd, "matKhauMoi"), chuoi(fd, "nhapLai")));
  return kq ?? { ok: true };
}
