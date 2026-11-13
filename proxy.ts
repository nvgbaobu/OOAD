// Kiểm tra sơ bộ + chuyển hướng theo vai trò (chỉ đọc cookie, không truy vấn DB).
// Kiểm quyền thật vẫn nằm ở lib/auth/dal.ts (yeuCauDangNhap) trong từng page/server action.
import { NextResponse, type NextRequest } from "next/server";
import { TEN_COOKIE, giaiMaToken } from "@/lib/auth/token";
import { duocTruyCap, trangChuTheoVaiTro } from "@/lib/auth/phanQuyen";

/** Trang vào được khi CHƯA đăng nhập. */
const TRANG_CONG_KHAI = ["/dang-nhap", "/quen-mat-khau"];

export default async function proxy(req: NextRequest) {
  const duongDan = req.nextUrl.pathname;
  const phien = await giaiMaToken(req.cookies.get(TEN_COOKIE)?.value);
  const chuyenDen = (url: string) => NextResponse.redirect(new URL(url, req.nextUrl));

  if (!phien) return TRANG_CONG_KHAI.includes(duongDan) ? NextResponse.next() : chuyenDen("/dang-nhap");
  // Đã đăng nhập mà vào trang đăng nhập / quên mật khẩu → về trang chủ theo vai trò
  if (duongDan === "/" || TRANG_CONG_KHAI.includes(duongDan) || !duocTruyCap(duongDan, phien.vaiTro)) {
    return chuyenDen(trangChuTheoVaiTro(phien.vaiTro));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp)$).*)"],
};
