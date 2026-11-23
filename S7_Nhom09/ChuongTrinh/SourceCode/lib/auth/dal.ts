// Lớp kiểm tra quyền (Data Access Layer). Mọi trang/server action cần đăng nhập phải gọi hàm ở đây –
// proxy.ts chỉ là kiểm tra sơ bộ.
import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TEN_COOKIE, giaiMaToken, type VaiTro } from "./token";
import { taiKhoanRepository } from "@/lib/repositories/taiKhoanRepository";
import { trangChuTheoVaiTro } from "./phanQuyen";

export { trangChuTheoVaiTro };

export type NguoiDung = { maTK: number; hoTen: string; soDienThoai: string; vaiTro: VaiTro };

/** Người dùng hiện tại, hoặc null. Kiểm tra lại DB để tài khoản bị khóa mất quyền ngay. */
export const layNguoiDung = cache(async (): Promise<NguoiDung | null> => {
  const phien = await giaiMaToken((await cookies()).get(TEN_COOKIE)?.value);
  if (!phien) return null;
  const tk = await taiKhoanRepository.timTheoMa(phien.maTK);
  if (!tk || tk.trangThai !== "HOAT_DONG") return null;
  return { maTK: tk.maTK, hoTen: tk.hoTen, soDienThoai: tk.soDienThoai, vaiTro: tk.vaiTro as VaiTro };
});

/** Bắt buộc đăng nhập (và đúng vai trò nếu truyền vào); sai thì chuyển hướng. */
export async function yeuCauDangNhap(...vaiTroChoPhep: VaiTro[]): Promise<NguoiDung> {
  const nd = await layNguoiDung();
  if (!nd) redirect("/dang-nhap");
  if (vaiTroChoPhep.length && !vaiTroChoPhep.includes(nd.vaiTro)) redirect(trangChuTheoVaiTro(nd.vaiTro));
  return nd;
}
