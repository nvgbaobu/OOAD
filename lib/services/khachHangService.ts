// Nghiệp vụ khách hàng thành viên – dùng chung cho POS (tạo nhanh) và màn hình Khách hàng.
import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/db";
import { khachHangRepository } from "@/lib/repositories/khachHangRepository";
import { nhatKyRepository } from "@/lib/repositories/nhatKyRepository";

export class LoiKhachHang extends Error {}

export type DuLieuKhachHang = { soDienThoai: string; hoTen: string; email?: string | null; diaChi?: string | null };

export const SDT_HOP_LE = /^0\d{9}$/;

/** Chuẩn hóa + kiểm tra dữ liệu; ném LoiKhachHang nếu sai. */
function kiemTra(d: DuLieuKhachHang): DuLieuKhachHang {
  const soDienThoai = d.soDienThoai.trim();
  const hoTen = d.hoTen.trim().replace(/\s+/g, " ");
  const email = d.email?.trim() || null;
  const diaChi = d.diaChi?.trim() || null;
  if (!SDT_HOP_LE.test(soDienThoai)) throw new LoiKhachHang("Số điện thoại gồm 10 chữ số, bắt đầu bằng 0");
  if (hoTen.length < 2) throw new LoiKhachHang("Nhập họ tên khách hàng");
  if (hoTen.length > 100) throw new LoiKhachHang("Họ tên tối đa 100 ký tự");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new LoiKhachHang("Email không hợp lệ");
  return { soDienThoai, hoTen, email, diaChi };
}

export const khachHangService = {
  /** Tạo khách hàng mới, gán hạng thấp nhất, 0 điểm. */
  async taoMoi(duLieu: DuLieuKhachHang, maTKThucHien: number, db: Db = prisma) {
    const d = kiemTra(duLieu);
    if (await khachHangRepository.timTheoSoDienThoai(db, d.soDienThoai)) {
      throw new LoiKhachHang(`Số điện thoại ${d.soDienThoai} đã được đăng ký`);
    }
    const hang = await khachHangRepository.hangThapNhat(db);
    if (!hang) throw new Error("Chưa có hạng thành viên nào (HangThanhVien). Hãy chạy seed.");
    const kh = await khachHangRepository.tao(db, { ...d, maHang: hang.maHang, diemHienTai: 0, diemTichLuy: 0 });
    await nhatKyRepository.ghi(
      { maTK: maTKThucHien, module: "KHACH_HANG", hanhDong: "THEM", noiDung: `KH #${kh.maKH} ${kh.hoTen} – ${kh.soDienThoai}` },
      db,
    );
    return kh;
  },
};
