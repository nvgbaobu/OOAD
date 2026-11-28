// Lớp thực thể BanSaoLuu – Bảng 3.81 (thuộc tính), Bảng 3.82 (phương thức).
import type { BanSaoLuu as BanSaoLuuModel } from "@/lib/generated/prisma/client";
import { banSaoLuuRepository } from "@/lib/repositories/banSaoLuuRepository";

/** Thư mục chứa file .bak bên trong container SQL Server (nằm trong volume mssql_data). */
export const THU_MUC_SAO_LUU = "/var/opt/mssql/data";

export class BanSaoLuu implements BanSaoLuuModel {
  // ───── Thuộc tính ─────
  declare maBackup: number;
  declare maTK: number; // người sao lưu
  declare thoiGian: Date;
  declare duongDanFile: string;
  declare kichThuoc: bigint; // byte

  constructor(duLieu: BanSaoLuuModel) {
    Object.assign(this, duLieu);
  }

  // ───── Phương thức ─────

  /**
   * Sao lưu CSDL ra file QuanLyBanSach_YYYYMMDD_HHmmss<hauTo>.bak và lưu thông tin bản sao lưu.
   * hauTo: chỉ chữ/số/_ (vd "_truocPhucHoi" – bản an toàn tạo trước khi phục hồi).
   */
  static async taoBanSaoLuu(maTK: number, hauTo = ""): Promise<BanSaoLuu> {
    if (!/^\w*$/.test(hauTo)) throw new Error("Hậu tố tên file không hợp lệ");
    const tenCSDL = process.env.DB_NAME ?? "QuanLyBanSach";
    if (!/^\w+$/.test(tenCSDL)) throw new Error("DB_NAME không hợp lệ");
    const luc = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    const tenFile = `${tenCSDL}_${luc.getFullYear()}${p(luc.getMonth() + 1)}${p(luc.getDate())}_${p(luc.getHours())}${p(luc.getMinutes())}${p(luc.getSeconds())}${hauTo}.bak`;
    const duongDan = `${THU_MUC_SAO_LUU}/${tenFile}`;
    await banSaoLuuRepository.saoLuuCSDL(tenCSDL, duongDan, tenFile);
    const kichThuoc = await banSaoLuuRepository.kichThuoc(tenCSDL, tenFile);
    return new BanSaoLuu(await banSaoLuuRepository.tao({ maTK, thoiGian: luc, duongDanFile: duongDan, kichThuoc }));
  }

  /**
   * Ghi lại thông tin bản sao lưu nếu CSDL chưa có (so theo đường dẫn file) – dùng sau khi phục hồi,
   * vì CSDL vừa phục hồi không có các dòng BanSaoLuu được tạo sau thời điểm của file .bak.
   */
  static async ghiLaiNeuThieu(d: Omit<BanSaoLuuModel, "maBackup" | "kichThuoc"> & { kichThuoc: bigint | number }): Promise<void> {
    if (await banSaoLuuRepository.timTheoDuongDan(d.duongDanFile)) return;
    // Chỉ lấy đúng các cột cần ghi – không truyền maBackup (cột IDENTITY, CSDL tự sinh)
    await banSaoLuuRepository.tao({ maTK: d.maTK, thoiGian: d.thoiGian, duongDanFile: d.duongDanFile, kichThuoc: d.kichThuoc });
  }

  /** Bản sao lưu theo mã. */
  static async timTheoMa(maBackup: number): Promise<BanSaoLuu | null> {
    const d = await banSaoLuuRepository.timTheoMa(maBackup);
    return d && new BanSaoLuu(d);
  }

  /**
   * Kiểm tra file sao lưu hợp lệ rồi phục hồi CSDL từ file này.
   * Phục hồi cần kết nối riêng tới CSDL master (đóng mọi kết nối đang mở) nên phần thực thi nằm ở phucHoiService.
   */
  async phucHoi(maTK: number): Promise<boolean> {
    const { phucHoiService } = await import("@/lib/services/phucHoiService");
    await phucHoiService.tuBanSaoLuu(this.maBackup, maTK);
    return true;
  }
}
