"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { caiDatService } from "@/lib/services/caiDatService";
import { taiKhoanService } from "@/lib/services/taiKhoanService";
import { batLoiNghiepVu, docForm, type KetQuaForm } from "@/lib/ketQuaForm";

const chuoi = (fd: FormData, k: string) => String(fd.get(k) ?? "");

/** Lưu cấu hình cửa hàng / tích điểm / phương thức thanh toán – chỉ Admin. */
export async function luuCauHinh(_: KetQuaForm, fd: FormData): Promise<KetQuaForm> {
  const nd = await yeuCauDangNhap("ADMIN");
  const duLieu = docForm(fd);
  const kq = await batLoiNghiepVu(() => caiDatService.luuCauHinh({
    tenCuaHang: chuoi(fd, "tenCuaHang"), diaChi: chuoi(fd, "diaChi"), soDienThoai: chuoi(fd, "soDienThoai"), maSoThue: chuoi(fd, "maSoThue"),
    logo: chuoi(fd, "logo"), tyLeQuyDoiDiem: chuoi(fd, "tyLeQuyDoiDiem"), giaTriMotDiem: chuoi(fd, "giaTriMotDiem"),
    ttTienMat: fd.get("ttTienMat") === "on", ttQuetThe: fd.get("ttQuetThe") === "on", ttMaQR: fd.get("ttMaQR") === "on",
  }, nd.maTK), duLieu);
  if (kq) return kq;
  redirect("/cai-dat?daLuu=1");
}

export async function saoLuuCSDL(): Promise<KetQuaForm> {
  const nd = await yeuCauDangNhap("ADMIN");
  const kq = await batLoiNghiepVu(() => caiDatService.saoLuu(nd.maTK));
  if (!kq) refresh();
  return kq;
}

/** Thêm (maTK rỗng) / sửa tài khoản – chỉ Admin. Mật khẩu không gửi ngược lại form khi lỗi. */
export async function luuTaiKhoan(_: KetQuaForm, fd: FormData): Promise<KetQuaForm> {
  const nd = await yeuCauDangNhap("ADMIN");
  const { matKhau, ...duLieu } = docForm(fd);
  const f = { soDienThoai: duLieu.soDienThoai ?? "", hoTen: duLieu.hoTen ?? "", email: duLieu.email ?? "", vaiTro: duLieu.vaiTro ?? "", matKhau };
  const maTK = Number(duLieu.maTK) || null;
  let ma = maTK;
  const kq = await batLoiNghiepVu(async () => {
    if (maTK) await taiKhoanService.capNhat(maTK, f, nd.maTK);
    else ma = (await taiKhoanService.tao(f, nd.maTK)).maTK;
  }, duLieu);
  if (kq) return kq;
  redirect(`/cai-dat/tai-khoan?daLuu=${ma}`);
}

export async function doiTrangThaiTaiKhoan(_: KetQuaForm, fd: FormData): Promise<KetQuaForm> {
  const nd = await yeuCauDangNhap("ADMIN");
  const kq = await batLoiNghiepVu(() => taiKhoanService.doiTrangThai(Number(fd.get("maTK")), fd.get("khoa") === "1", nd.maTK));
  if (!kq) refresh();
  return kq;
}

export async function datLaiMatKhau(_: KetQuaForm, fd: FormData): Promise<KetQuaForm> {
  const nd = await yeuCauDangNhap("ADMIN");
  const kq = await batLoiNghiepVu(() =>
    taiKhoanService.datLaiMatKhau(Number(fd.get("maTK")), chuoi(fd, "matKhauMoi"), chuoi(fd, "nhapLai"), nd.maTK));
  return kq ?? { thongBao: "Đã đặt lại mật khẩu" };
}

/** Người dùng tự đổi mật khẩu – mọi vai trò. */
export async function doiMatKhau(_: KetQuaForm, fd: FormData): Promise<KetQuaForm> {
  const nd = await yeuCauDangNhap("ADMIN", "STAFF");
  const kq = await batLoiNghiepVu(() => taiKhoanService.doiMatKhau(nd.maTK, chuoi(fd, "matKhauCu"), chuoi(fd, "matKhauMoi"), chuoi(fd, "nhapLai")));
  return kq ?? { thongBao: "Đã đổi mật khẩu" };
}
