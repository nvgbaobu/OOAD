// Bảng phân quyền theo đường dẫn – dùng chung cho proxy.ts (chuyển hướng sớm) và DAL.
// Khi thêm trang chỉ Admin được vào, thêm mẫu đường dẫn vào CHI_ADMIN.
import type { VaiTro } from "./token";

export const CHI_ADMIN: RegExp[] = [
  /^\/dashboard(\/|$)/,
  /^\/bao-cao(\/|$)/, // báo cáo doanh thu + xuất Excel
  /^\/sach\/.+/, // /sach (danh sách) Staff xem được; thêm/sửa sách, thể loại: chỉ Admin
  /^\/khach-hang\/hang(\/|$)/, // cấu hình hạng thành viên; tra cứu/thêm/sửa khách thì Staff được
  /^\/khuyen-mai\/.+/, // /khuyen-mai (danh sách) Staff xem được; thêm/sửa mã, combo: chỉ Admin
  /^\/nha-cung-cap(\/|$)/, // Staff chỉ chọn NCC khi lập phiếu nhập, không quản lý NCC
  /^\/cai-dat(\/|$)/, // cấu hình, tài khoản, nhật ký, sao lưu (đổi mật khẩu cá nhân ở /ca-nhan – mọi người dùng)
];

export const trangChuTheoVaiTro = (vaiTro: VaiTro) => (vaiTro === "ADMIN" ? "/dashboard" : "/pos");

export const duocTruyCap = (duongDan: string, vaiTro: VaiTro) =>
  vaiTro === "ADMIN" || !CHI_ADMIN.some((mau) => mau.test(duongDan));
