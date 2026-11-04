// Bảng phân quyền theo đường dẫn – dùng chung cho proxy.ts (chuyển hướng sớm) và DAL.
// Khi thêm module chỉ Admin được vào, thêm tiền tố đường dẫn vào CHI_ADMIN.
import type { VaiTro } from "./token";

export const CHI_ADMIN = ["/dashboard"];

export const trangChuTheoVaiTro = (vaiTro: VaiTro) => (vaiTro === "ADMIN" ? "/dashboard" : "/pos");

export const duocTruyCap = (duongDan: string, vaiTro: VaiTro) =>
  vaiTro === "ADMIN" || !CHI_ADMIN.some((p) => duongDan === p || duongDan.startsWith(p + "/"));
