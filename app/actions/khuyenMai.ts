"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { khuyenMaiService, type FormMa } from "@/lib/services/khuyenMaiService";
import { batLoiNghiepVu, docForm, type KetQuaForm } from "@/lib/ketQuaForm";

const truongMa = ["maCode", "loaiGiam", "giaTriGiam", "giaTriDonToiThieu", "soLuongToiDa", "ngayBatDau", "ngayKetThuc"] as const;

/** Thêm (maMGG rỗng) / sửa mã giảm giá – chỉ Admin. */
export async function luuMaGiamGia(_: KetQuaForm, fd: FormData): Promise<KetQuaForm> {
  const nd = await yeuCauDangNhap("ADMIN");
  const duLieu = docForm(fd);
  const f = Object.fromEntries(truongMa.map((k) => [k, duLieu[k] ?? ""])) as FormMa;
  const maMGG = Number(duLieu.maMGG) || null;
  const kq = await batLoiNghiepVu(async () => {
    if (maMGG) await khuyenMaiService.capNhatMa(maMGG, f, nd.maTK);
    else await khuyenMaiService.taoMa(f, nd.maTK);
  }, duLieu);
  if (kq) return kq;
  redirect(`/khuyen-mai?daLuu=${encodeURIComponent(f.maCode.trim().toUpperCase())}`);
}

export async function doiTrangThaiMaGiamGia(_: KetQuaForm, fd: FormData): Promise<KetQuaForm> {
  const nd = await yeuCauDangNhap("ADMIN");
  const kq = await batLoiNghiepVu(() => khuyenMaiService.doiTrangThaiMa(Number(fd.get("maMGG")), fd.get("hoatDong") === "1", nd.maTK));
  if (!kq) refresh();
  return kq;
}

export async function xoaMaGiamGia(_: KetQuaForm, fd: FormData): Promise<KetQuaForm> {
  const nd = await yeuCauDangNhap("ADMIN");
  const kq = await batLoiNghiepVu(() => khuyenMaiService.xoaMa(Number(fd.get("maMGG")), nd.maTK));
  if (kq) return kq;
  redirect("/khuyen-mai");
}

/** Thêm / sửa combo – các dòng gửi dạng maSach[] + soLuong[] (theo thứ tự). */
export async function luuCombo(_: KetQuaForm, fd: FormData): Promise<KetQuaForm> {
  const nd = await yeuCauDangNhap("ADMIN");
  const ds = (k: string) => fd.getAll(k).map(String);
  const soLuong = ds("soLuong");
  const maCombo = Number(fd.get("maCombo")) || null;
  const kq = await batLoiNghiepVu(() => khuyenMaiService.luuCombo(maCombo, {
    tenCombo: String(fd.get("tenCombo") ?? ""), giaCombo: String(fd.get("giaCombo") ?? ""),
    ngayBatDau: String(fd.get("ngayBatDau") ?? ""), ngayKetThuc: String(fd.get("ngayKetThuc") ?? ""),
    dong: ds("maSach").map((m, i) => ({ maSach: m, soLuong: soLuong[i] ?? "" })),
  }, nd.maTK));
  if (kq) return kq;
  redirect("/khuyen-mai?daLuuCombo=1#combo");
}

export async function doiTrangThaiCombo(_: KetQuaForm, fd: FormData): Promise<KetQuaForm> {
  const nd = await yeuCauDangNhap("ADMIN");
  const kq = await batLoiNghiepVu(() => khuyenMaiService.doiTrangThaiCombo(Number(fd.get("maCombo")), fd.get("hoatDong") === "1", nd.maTK));
  if (!kq) refresh();
  return kq;
}

export async function xoaCombo(_: KetQuaForm, fd: FormData): Promise<KetQuaForm> {
  const nd = await yeuCauDangNhap("ADMIN");
  const kq = await batLoiNghiepVu(() => khuyenMaiService.xoaCombo(Number(fd.get("maCombo")), nd.maTK));
  if (kq) return kq;
  redirect("/khuyen-mai#combo");
}
