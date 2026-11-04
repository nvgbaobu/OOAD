"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { khoService, type DongPhieuTho } from "@/lib/services/khoService";
import { batLoiNghiepVu, type KetQuaForm } from "@/lib/ketQuaForm";

export type LoaiPhieu = "kiem-ke" | "xuat-huy";

/** Đọc các dòng phiếu: mỗi dòng gửi 3 ô cùng tên maSach / soLuong / lyDo (theo thứ tự). */
function docDong(fd: FormData): DongPhieuTho[] {
  const ds = (k: string) => fd.getAll(k).map(String);
  const [maSach, soLuong, lyDo] = [ds("maSach"), ds("soLuong"), ds("lyDo")];
  return maSach.map((m, i) => ({ maSach: m, slThucTe: soLuong[i], soLuong: soLuong[i], lyDo: lyDo[i] ?? "" }));
}

/** Lập phiếu kiểm kê / xuất hủy (Staff và Admin). Form giữ dữ liệu ở state phía client nên không cần trả duLieu. */
export async function lapPhieu(loai: LoaiPhieu, _: KetQuaForm, fd: FormData): Promise<KetQuaForm> {
  const nd = await yeuCauDangNhap("ADMIN", "STAFF");
  const ghiChu = String(fd.get("ghiChu") ?? "");
  const dong = docDong(fd);
  let ma = 0;
  const kq = await batLoiNghiepVu(async () => {
    ma = loai === "kiem-ke"
      ? (await khoService.lapKiemKe(ghiChu, dong, nd.maTK)).maPKK
      : (await khoService.lapXuatHuy(ghiChu, dong, nd.maTK)).maPXH;
  });
  if (kq) return kq;
  redirect(`/kho/${loai}/${ma}`);
}

/** Duyệt phiếu – chỉ Admin. */
export async function duyetPhieu(loai: LoaiPhieu, _: KetQuaForm, fd: FormData): Promise<KetQuaForm> {
  const nd = await yeuCauDangNhap("ADMIN");
  const ma = Number(fd.get("ma"));
  const kq = await batLoiNghiepVu(() => (loai === "kiem-ke" ? khoService.duyetKiemKe(ma, nd.maTK) : khoService.duyetXuatHuy(ma, nd.maTK)));
  if (!kq) refresh();
  return kq;
}

/** Từ chối phiếu (bắt buộc lý do) – chỉ Admin. */
export async function tuChoiPhieu(loai: LoaiPhieu, _: KetQuaForm, fd: FormData): Promise<KetQuaForm> {
  const nd = await yeuCauDangNhap("ADMIN");
  const ma = Number(fd.get("ma"));
  const lyDo = String(fd.get("lyDoTuChoi") ?? "");
  const kq = await batLoiNghiepVu(() =>
    loai === "kiem-ke" ? khoService.tuChoiKiemKe(ma, lyDo, nd.maTK) : khoService.tuChoiXuatHuy(ma, lyDo, nd.maTK),
  );
  if (!kq) refresh();
  return kq;
}
