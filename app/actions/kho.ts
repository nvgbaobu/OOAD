"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { khoService, type DongPhieuTho } from "@/lib/services/khoService";
import { batLoiNghiepVu, type KetQuaForm } from "@/lib/ketQuaForm";

export type LoaiPhieu = "phieu-nhap" | "kiem-ke" | "xuat-huy";

/** Đọc các dòng phiếu: mỗi dòng gửi các ô cùng tên maSach / soLuong / lyDo | giaNhap (theo thứ tự). */
function docDong(fd: FormData): DongPhieuTho[] {
  const ds = (k: string) => fd.getAll(k).map(String);
  const [maSach, soLuong, lyDo, giaNhap] = [ds("maSach"), ds("soLuong"), ds("lyDo"), ds("giaNhap")];
  return maSach.map((m, i) => ({ maSach: m, slThucTe: soLuong[i], soLuong: soLuong[i], lyDo: lyDo[i] ?? "", giaNhap: giaNhap[i] ?? "" }));
}

/** Lập phiếu nhập / kiểm kê / xuất hủy (Staff và Admin). Form giữ dữ liệu ở state phía client nên không cần trả duLieu. */
export async function lapPhieu(loai: LoaiPhieu, _: KetQuaForm, fd: FormData): Promise<KetQuaForm> {
  const nd = await yeuCauDangNhap("ADMIN", "STAFF");
  const ghiChu = String(fd.get("ghiChu") ?? "");
  const dong = docDong(fd);
  let ma = 0;
  const kq = await batLoiNghiepVu(async () => {
    if (loai === "phieu-nhap") ma = (await khoService.lapPhieuNhap(String(fd.get("maNCC") ?? ""), ghiChu, dong, nd.maTK)).maPN;
    else if (loai === "kiem-ke") ma = (await khoService.lapKiemKe(ghiChu, dong, nd.maTK)).maPKK;
    else ma = (await khoService.lapXuatHuy(ghiChu, dong, nd.maTK)).maPXH;
  });
  if (kq) return kq;
  redirect(`/kho/${loai}/${ma}`);
}

/** Duyệt phiếu – chỉ Admin. */
export async function duyetPhieu(loai: LoaiPhieu, _: KetQuaForm, fd: FormData): Promise<KetQuaForm> {
  const nd = await yeuCauDangNhap("ADMIN");
  const ma = Number(fd.get("ma"));
  const duyet = { "phieu-nhap": khoService.duyetPhieuNhap, "kiem-ke": khoService.duyetKiemKe, "xuat-huy": khoService.duyetXuatHuy }[loai];
  const kq = await batLoiNghiepVu(() => duyet(ma, nd.maTK));
  if (!kq) refresh();
  return kq;
}

/** Từ chối phiếu (bắt buộc lý do) – chỉ Admin. */
export async function tuChoiPhieu(loai: LoaiPhieu, _: KetQuaForm, fd: FormData): Promise<KetQuaForm> {
  const nd = await yeuCauDangNhap("ADMIN");
  const ma = Number(fd.get("ma"));
  const lyDo = String(fd.get("lyDoTuChoi") ?? "");
  const tuChoi = { "phieu-nhap": khoService.tuChoiPhieuNhap, "kiem-ke": khoService.tuChoiKiemKe, "xuat-huy": khoService.tuChoiXuatHuy }[loai];
  const kq = await batLoiNghiepVu(() => tuChoi(ma, lyDo, nd.maTK));
  if (!kq) refresh();
  return kq;
}
