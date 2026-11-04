"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { posService, LoiPOS, KhongTimThayKhachHang, type PhuongThucTT } from "@/lib/services/posService";

export type KetQuaHanhDong = { loi?: string } | undefined;
export type KetQuaChonKhach = { loi?: string; chuaDangKy?: string } | undefined;

/** Chạy nghiệp vụ POS cho người đang đăng nhập; lỗi nghiệp vụ → trả { loi } để form hiển thị. */
async function chay(fn: (maTK: number) => Promise<unknown>): Promise<KetQuaHanhDong> {
  const nd = await yeuCauDangNhap("ADMIN", "STAFF");
  try {
    await fn(nd.maTK);
  } catch (e) {
    if (e instanceof LoiPOS) return { loi: e.message };
    throw e;
  }
  refresh();
  return undefined;
}

const soNguyen = (v: FormDataEntryValue | null) => Number.parseInt(String(v ?? ""), 10);
const chuoi = (v: FormDataEntryValue | null) => String(v ?? "").trim();

export async function themSach(_: KetQuaHanhDong, fd: FormData) {
  return chay((maTK) => posService.themSach(maTK, soNguyen(fd.get("maSach")), 1));
}

export async function capNhatSoLuong(_: KetQuaHanhDong, fd: FormData) {
  return chay((maTK) => posService.capNhatSoLuong(maTK, soNguyen(fd.get("maSach")), soNguyen(fd.get("soLuong"))));
}

export async function chonKhachHang(_: KetQuaChonKhach, fd: FormData): Promise<KetQuaChonKhach> {
  const sdt = chuoi(fd.get("soDienThoai"));
  const nd = await yeuCauDangNhap("ADMIN", "STAFF");
  try {
    await posService.chonKhachHang(nd.maTK, sdt);
  } catch (e) {
    // SĐT chưa đăng ký → giao diện hiện form tạo nhanh
    if (e instanceof KhongTimThayKhachHang) return { loi: e.message, chuaDangKy: e.soDienThoai };
    if (e instanceof LoiPOS) return { loi: e.message };
    throw e;
  }
  refresh();
  return undefined;
}

export async function taoNhanhKhachHang(_: KetQuaHanhDong, fd: FormData) {
  return chay((maTK) => posService.taoNhanhKhachHang(maTK, chuoi(fd.get("soDienThoai")), chuoi(fd.get("hoTen"))));
}

export async function boKhachHang() {
  return chay((maTK) => posService.boKhachHang(maTK));
}

export async function apMaGiamGia(_: KetQuaHanhDong, fd: FormData) {
  const ma = chuoi(fd.get("maCode")).toUpperCase();
  if (!ma) return { loi: "Nhập mã giảm giá" };
  return chay((maTK) => posService.apMaGiamGia(maTK, ma));
}

export async function boMaGiamGia() {
  return chay((maTK) => posService.boMaGiamGia(maTK));
}

export async function datDiemSuDung(_: KetQuaHanhDong, fd: FormData) {
  return chay((maTK) => posService.datDiemSuDung(maTK, soNguyen(fd.get("diem"))));
}

export async function huyDon() {
  return chay((maTK) => posService.huyDon(maTK));
}

export async function thanhToan(_: KetQuaHanhDong, fd: FormData): Promise<KetQuaHanhDong> {
  const nd = await yeuCauDangNhap("ADMIN", "STAFF");
  const phuongThuc = chuoi(fd.get("phuongThucTT")) as PhuongThucTT;
  const tienKhachDua = phuongThuc === "TIEN_MAT" ? Number(chuoi(fd.get("tienKhachDua")).replace(/\D/g, "") || NaN) : null;
  let maHD: number;
  try {
    maHD = await posService.thanhToan(nd.maTK, phuongThuc, tienKhachDua);
  } catch (e) {
    if (e instanceof LoiPOS) return { loi: e.message };
    throw e;
  }
  redirect(`/pos/hoa-don/${maHD}`); // ngoài try/catch
}
