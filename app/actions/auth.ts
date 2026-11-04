"use server";

import { redirect } from "next/navigation";
import { authService } from "@/lib/services/authService";
import { taoPhien, xoaPhien } from "@/lib/auth/session";
import { layNguoiDung, trangChuTheoVaiTro } from "@/lib/auth/dal";

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
  if (nd) await authService.dangXuat(nd.maTK);
  await xoaPhien();
  redirect("/dang-nhap");
}
