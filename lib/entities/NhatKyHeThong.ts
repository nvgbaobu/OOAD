// Lớp thực thể NhatKyHeThong – Bảng 3.79 (thuộc tính), Bảng 3.80 (phương thức).
import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/db";
import type { Prisma, NhatKyHeThong as NhatKyHeThongModel } from "@/lib/generated/prisma/client";
import { nhatKyRepository, type GhiNhatKy } from "@/lib/repositories/nhatKyRepository";

export class NhatKyHeThong implements NhatKyHeThongModel {
  // ───── Thuộc tính ─────
  declare maLog: bigint;
  declare maTK: number | null; // NULL: vd đăng nhập thất bại
  declare thoiGian: Date;
  declare module: string; // vd TAI_KHOAN, BAN_HANG, KHO
  declare hanhDong: string; // vd DANG_NHAP, THANH_TOAN
  declare noiDung: string | null;

  constructor(duLieu: NhatKyHeThongModel) {
    Object.assign(this, duLieu);
  }

  // ───── Phương thức ─────

  /** Ghi một thao tác quan trọng { maTK, module, hanhDong, noiDung } (thời gian do CSDL ghi). */
  static async ghiNhatKy(nk: GhiNhatKy, db: Db = prisma): Promise<NhatKyHeThong> {
    return new NhatKyHeThong(await nhatKyRepository.ghi(nk, db));
  }

  /** Tra cứu nhật ký theo điều kiện (module, người, khoảng thời gian, từ khóa), mới nhất trước. */
  static async traCuu(dieuKien: Prisma.NhatKyHeThongWhereInput, boQua = 0, lay = 50): Promise<NhatKyHeThong[]> {
    return (await nhatKyRepository.traCuu(dieuKien, boQua, lay)).map((d) => new NhatKyHeThong(d));
  }
}
