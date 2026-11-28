// Lớp trừu tượng PhieuKho – Bảng 3.63 (thuộc tính), Bảng 3.64 (phương thức).
// Lớp cha của PhieuNhap, PhieuKiemKe, PhieuXuatHuy – cùng vòng đời: lập → CHO_DUYET → Admin DA_DUYET | TU_CHOI.
// Không có bảng riêng: thuộc tính chung được lặp lại trong bảng của từng lớp con.
import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/db";

export type TrangThaiPhieu = "CHO_DUYET" | "DA_DUYET" | "TU_CHOI";
export type DuLieuXuLyPhieu = { trangThai: TrangThaiPhieu; maTKDuyet: number; lyDoTuChoi?: string };

export abstract class PhieuKho {
  // ───── Thuộc tính ─────
  declare maTKLap: number;
  declare maTKDuyet: number | null;
  declare ngayLap: Date;
  declare ngayDuyet: Date | null;
  declare trangThai: string; // CHO_DUYET | DA_DUYET | TU_CHOI
  declare ghiChu: string | null;
  declare lyDoTuChoi: string | null;

  constructor(duLieu: object) {
    Object.assign(this, duLieu);
  }

  /** Mã phiếu (maPN / maPKK / maPXH tùy lớp con). */
  abstract get ma(): number;
  /** Chuyển trạng thái có điều kiện "còn CHO_DUYET" trong CSDL – mỗi lớp con gọi repository của bảng mình. */
  protected abstract xuLy(db: Db, duLieu: DuLieuXuLyPhieu): Promise<boolean>;

  // ───── Phương thức ─────

  /** Lập xong → chuyển phiếu sang Chờ duyệt (gọi trước khi lưu phiếu mới). */
  guiDuyet(): void {
    this.trangThai = "CHO_DUYET";
  }

  /** Admin duyệt phiếu: ghi người duyệt + thời điểm. Trả về false nếu phiếu đã được xử lý trước đó. */
  async duyet(maTK: number, db: Db = prisma): Promise<boolean> {
    return this.capNhatXuLy(db, { trangThai: "DA_DUYET", maTKDuyet: maTK });
  }

  /** Admin từ chối phiếu (kho không đổi), lưu lý do. Trả về false nếu phiếu đã được xử lý trước đó. */
  async tuChoi(maTK: number, lyDo: string, db: Db = prisma): Promise<boolean> {
    return this.capNhatXuLy(db, { trangThai: "TU_CHOI", maTKDuyet: maTK, lyDoTuChoi: lyDo });
  }

  private async capNhatXuLy(db: Db, duLieu: DuLieuXuLyPhieu) {
    if (this.trangThai && this.trangThai !== "CHO_DUYET") return false;
    const ok = await this.xuLy(db, duLieu);
    if (ok) Object.assign(this, { ...duLieu, ngayDuyet: new Date() });
    return ok;
  }
}
