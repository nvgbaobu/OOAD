"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { nhaCungCapService, type FormNhaCungCap } from "@/lib/services/nhaCungCapService";
import { batLoiNghiepVu, docForm, type KetQuaForm } from "@/lib/ketQuaForm";

const truong = ["tenNCC", "maSoThue", "diaChi", "nguoiLienHe", "soDienThoai"] as const;

/** Thêm (maNCC rỗng) hoặc sửa NCC. Chỉ Admin. */
export async function luuNhaCungCap(_: KetQuaForm, fd: FormData): Promise<KetQuaForm> {
  const nd = await yeuCauDangNhap("ADMIN");
  const duLieu = docForm(fd);
  const f = Object.fromEntries(truong.map((k) => [k, duLieu[k] ?? ""])) as FormNhaCungCap;
  const maNCC = Number(duLieu.maNCC) || null;
  let ma = maNCC;
  const kq = await batLoiNghiepVu(async () => {
    if (maNCC) await nhaCungCapService.capNhat(maNCC, f, nd.maTK);
    else ma = (await nhaCungCapService.tao(f, nd.maTK)).maNCC;
  }, duLieu);
  if (kq) return kq;
  redirect(`/nha-cung-cap?daLuu=${ma}`);
}

export async function doiTrangThaiNhaCungCap(_: KetQuaForm, fd: FormData): Promise<KetQuaForm> {
  const nd = await yeuCauDangNhap("ADMIN");
  const trangThai = fd.get("trangThai") === "DANG_GIAO_DICH" ? "DANG_GIAO_DICH" : "NGUNG_GIAO_DICH";
  const kq = await batLoiNghiepVu(() => nhaCungCapService.doiTrangThai(Number(fd.get("maNCC")), trangThai, nd.maTK));
  if (!kq) refresh();
  return kq;
}

export async function xoaNhaCungCap(_: KetQuaForm, fd: FormData): Promise<KetQuaForm> {
  const nd = await yeuCauDangNhap("ADMIN");
  const kq = await batLoiNghiepVu(() => nhaCungCapService.xoa(Number(fd.get("maNCC")), nd.maTK));
  if (kq) return kq;
  redirect("/nha-cung-cap");
}
