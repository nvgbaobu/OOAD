"use server";

import { redirect } from "next/navigation";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { khachHangService } from "@/lib/services/khachHangService";
import { batLoiNghiepVu, docForm, type KetQuaForm } from "@/lib/ketQuaForm";

/** Thêm (maKH rỗng) hoặc sửa thông tin khách – Staff và Admin. */
export async function luuKhachHang(_: KetQuaForm, fd: FormData): Promise<KetQuaForm> {
  const nd = await yeuCauDangNhap("ADMIN", "STAFF");
  const duLieu = docForm(fd);
  const d = { soDienThoai: duLieu.soDienThoai ?? "", hoTen: duLieu.hoTen ?? "", email: duLieu.email, diaChi: duLieu.diaChi };
  const maKH = Number(duLieu.maKH) || null;
  let ma = maKH;
  const kq = await batLoiNghiepVu(async () => {
    if (maKH) await khachHangService.capNhat(maKH, d, nd.maTK);
    else ma = (await khachHangService.taoMoi(d, nd.maTK)).maKH;
  }, duLieu);
  if (kq) return kq;
  redirect(`/khach-hang/${ma}?daLuu=1`);
}

/** Xóa khách chưa có hóa đơn – chỉ Admin. */
export async function xoaKhachHang(_: KetQuaForm, fd: FormData): Promise<KetQuaForm> {
  const nd = await yeuCauDangNhap("ADMIN");
  const kq = await batLoiNghiepVu(() => khachHangService.xoa(Number(fd.get("maKH")), nd.maTK));
  if (kq) return kq;
  redirect("/khach-hang");
}

/** Thêm / sửa hạng thành viên – chỉ Admin. */
export async function luuHang(_: KetQuaForm, fd: FormData): Promise<KetQuaForm> {
  const nd = await yeuCauDangNhap("ADMIN");
  const duLieu = docForm(fd);
  let soDoi = 0;
  const kq = await batLoiNghiepVu(async () => {
    soDoi = await khachHangService.luuHang(Number(duLieu.maHang) || null, {
      tenHang: duLieu.tenHang ?? "", diemToiThieu: duLieu.diemToiThieu ?? "", phanTramUuDai: duLieu.phanTramUuDai ?? "",
    }, nd.maTK);
  }, duLieu);
  if (kq) return kq;
  redirect(`/khach-hang/hang?soDoi=${soDoi}`);
}

export async function xoaHang(_: KetQuaForm, fd: FormData): Promise<KetQuaForm> {
  const nd = await yeuCauDangNhap("ADMIN");
  let soDoi = 0;
  const kq = await batLoiNghiepVu(async () => { soDoi = await khachHangService.xoaHang(Number(fd.get("maHang")), nd.maTK); });
  if (kq) return kq;
  redirect(`/khach-hang/hang?soDoi=${soDoi}`);
}
