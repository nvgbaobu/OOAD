"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { sachService, type FormSach } from "@/lib/services/sachService";
import { batLoiNghiepVu, docForm, type KetQuaForm } from "@/lib/ketQuaForm";

const truongSach = ["isbn", "tenSach", "tacGia", "nhaXuatBan", "namXB", "maTL", "giaNhap", "giaBan", "viTriKe", "dinhMucToiThieu", "hinhAnh"] as const;

/** Thêm (maSach rỗng) hoặc sửa sách. Chỉ Admin. */
export async function luuSach(_: KetQuaForm, fd: FormData): Promise<KetQuaForm> {
  const nd = await yeuCauDangNhap("ADMIN");
  const duLieu = docForm(fd);
  const f = Object.fromEntries(truongSach.map((k) => [k, duLieu[k] ?? ""])) as FormSach;
  const maSach = Number(duLieu.maSach) || null;
  let maMoi = maSach;
  const kq = await batLoiNghiepVu(async () => {
    if (maSach) await sachService.capNhat(maSach, f, nd.maTK);
    else maMoi = (await sachService.tao(f, nd.maTK)).maSach;
  }, duLieu);
  if (kq) return kq;
  redirect(`/sach?daLuu=${maMoi}`);
}

export async function doiTrangThaiSach(_: KetQuaForm, fd: FormData): Promise<KetQuaForm> {
  const nd = await yeuCauDangNhap("ADMIN");
  const trangThai = fd.get("trangThai") === "DANG_BAN" ? "DANG_BAN" : "NGUNG_KINH_DOANH";
  const kq = await batLoiNghiepVu(() => sachService.doiTrangThai(Number(fd.get("maSach")), trangThai, nd.maTK));
  if (!kq) refresh();
  return kq;
}

export async function luuTheLoai(_: KetQuaForm, fd: FormData): Promise<KetQuaForm> {
  const nd = await yeuCauDangNhap("ADMIN");
  const duLieu = docForm(fd);
  const kq = await batLoiNghiepVu(
    () => sachService.luuTheLoai(Number(duLieu.maTL) || null, duLieu.tenTL ?? "", nd.maTK),
    duLieu,
  );
  if (!kq) refresh();
  return kq;
}

export async function xoaTheLoai(_: KetQuaForm, fd: FormData): Promise<KetQuaForm> {
  const nd = await yeuCauDangNhap("ADMIN");
  const kq = await batLoiNghiepVu(() => sachService.xoaTheLoai(Number(fd.get("maTL")), nd.maTK));
  if (!kq) refresh();
  return kq;
}
