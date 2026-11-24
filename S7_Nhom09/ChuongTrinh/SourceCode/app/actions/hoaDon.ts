"use server";

import { refresh } from "next/cache";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { hoaDonService } from "@/lib/services/hoaDonService";
import { batLoiNghiepVu, type KetQuaForm } from "@/lib/ketQuaForm";

/** Hủy hóa đơn đã thanh toán – chỉ Admin, bắt buộc lý do. */
export async function huyHoaDon(_: KetQuaForm, fd: FormData): Promise<KetQuaForm> {
  const nd = await yeuCauDangNhap("ADMIN");
  const kq = await batLoiNghiepVu(() => hoaDonService.huy(Number(fd.get("maHD")), String(fd.get("lyDoHuy") ?? ""), nd.maTK));
  if (!kq) refresh();
  return kq;
}
