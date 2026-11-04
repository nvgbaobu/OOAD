// Bảng phân quyền theo đường dẫn – dùng chung cho proxy.ts (chuyển hướng sớm) và DAL.
// Khi thêm trang chỉ Admin được vào, thêm mẫu đường dẫn vào CHI_ADMIN.
import type { VaiTro } from "./token";

export const CHI_ADMIN: RegExp[] = [
  /^\/dashboard(\/|$)/,
  /^\/sach\/.+/, // /sach (danh sách) Staff xem được; thêm/sửa sách, thể loại: chỉ Admin
];

export const trangChuTheoVaiTro = (vaiTro: VaiTro) => (vaiTro === "ADMIN" ? "/dashboard" : "/pos");

export const duocTruyCap = (duongDan: string, vaiTro: VaiTro) =>
  vaiTro === "ADMIN" || !CHI_ADMIN.some((mau) => mau.test(duongDan));
