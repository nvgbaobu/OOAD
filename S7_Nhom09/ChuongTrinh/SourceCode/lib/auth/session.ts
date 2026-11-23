import "server-only";
import { cookies } from "next/headers";
import { TEN_COOKIE, THOI_HAN_PHIEN_GIO, kyToken, type PhienDangNhap } from "./token";

export async function taoPhien(phien: PhienDangNhap) {
  const token = await kyToken(phien);
  (await cookies()).set(TEN_COOKIE, token, {
    httpOnly: true,
    // POS chạy nội bộ qua http (IP LAN) → chỉ bật Secure khi có HTTPS
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/",
    maxAge: THOI_HAN_PHIEN_GIO * 60 * 60,
  });
}

export async function xoaPhien() {
  (await cookies()).delete(TEN_COOKIE);
}
