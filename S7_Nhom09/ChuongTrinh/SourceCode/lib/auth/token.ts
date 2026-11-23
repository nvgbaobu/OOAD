// Ký / giải mã token phiên (JWT HS256). Không dùng cookies() để proxy.ts cũng import được.
import { SignJWT, jwtVerify } from "jose";

export type VaiTro = "ADMIN" | "STAFF";
export type PhienDangNhap = { maTK: number; vaiTro: VaiTro };

export const TEN_COOKIE = "qlbs_session";
export const THOI_HAN_PHIEN_GIO = 12; // 1 ca làm việc

const khoa = () => {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Thiếu SESSION_SECRET trong .env");
  return new TextEncoder().encode(secret);
};

export async function kyToken(phien: PhienDangNhap) {
  return new SignJWT(phien)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${THOI_HAN_PHIEN_GIO}h`)
    .sign(khoa());
}

export async function giaiMaToken(token: string | undefined): Promise<PhienDangNhap | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, khoa(), { algorithms: ["HS256"] });
    if (typeof payload.maTK !== "number" || (payload.vaiTro !== "ADMIN" && payload.vaiTro !== "STAFF")) return null;
    return { maTK: payload.maTK, vaiTro: payload.vaiTro };
  } catch {
    return null;
  }
}
