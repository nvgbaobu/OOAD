// Lớp thực thể NhaCungCap – Bảng 3.61 (thuộc tính), Bảng 3.62 (phương thức).
import type { NhaCungCap as NhaCungCapModel } from "@/lib/generated/prisma/client";
import { nhaCungCapRepository, type LocNhaCungCap } from "@/lib/repositories/nhaCungCapRepository";

export class NhaCungCap implements NhaCungCapModel {
  // ───── Thuộc tính ─────
  declare maNCC: number;
  declare tenNCC: string;
  declare diaChi: string | null;
  declare maSoThue: string;
  declare nguoiLienHe: string | null;
  declare soDienThoai: string | null;
  declare trangThaiHopTac: string; // DANG_GIAO_DICH | NGUNG_GIAO_DICH

  constructor(duLieu: NhaCungCapModel) {
    Object.assign(this, duLieu);
  }

  // ───── Phương thức ─────

  /** Đang giao dịch → được chọn khi lập phiếu nhập mới. */
  dangGiaoDich(): boolean {
    return this.trangThaiHopTac === "DANG_GIAO_DICH";
  }

  /** Chuyển trạng thái hợp tác (Đang giao dịch / Ngừng giao dịch). */
  async capNhatTrangThai(tt: "DANG_GIAO_DICH" | "NGUNG_GIAO_DICH"): Promise<void> {
    await nhaCungCapRepository.capNhat(this.maNCC, { trangThaiHopTac: tt });
    this.trangThaiHopTac = tt;
  }

  /** Số phiếu nhập của nhà cung cấp – đã có phiếu thì không xóa được, chỉ ngừng giao dịch. */
  soPhieuNhap(): Promise<number> {
    return nhaCungCapRepository.demPhieuNhap(this.maNCC);
  }

  /** Xóa nhà cung cấp. */
  async xoa(): Promise<void> {
    await nhaCungCapRepository.xoa(this.maNCC);
  }

  /** Nhà cung cấp mới (chưa lưu). */
  static moi(d: Omit<NhaCungCapModel, "maNCC">): NhaCungCap {
    return new NhaCungCap({ maNCC: 0, ...d });
  }

  /** Tìm nhà cung cấp theo mã số thuế. */
  static async timTheoMST(mst: string): Promise<NhaCungCap | null> {
    const d = await nhaCungCapRepository.timTheoMaSoThue(mst);
    return d && new NhaCungCap(d);
  }

  /** Mã số thuế đã thuộc nhà cung cấp khác chưa (bỏ qua nhà cung cấp đang sửa). */
  static async kiemTraTrungMST(mst: string, boQuaMaNCC?: number): Promise<boolean> {
    const d = await nhaCungCapRepository.timTheoMaSoThue(mst);
    return !!d && d.maNCC !== boQuaMaNCC;
  }

  /** Tìm nhà cung cấp theo mã. */
  static async timTheoMa(maNCC: number): Promise<NhaCungCap | null> {
    const d = await nhaCungCapRepository.timTheoMa(maNCC);
    return d && new NhaCungCap(d);
  }

  /** Danh sách nhà cung cấp theo bộ lọc. */
  static async layDanhSach(loc: LocNhaCungCap = {}): Promise<NhaCungCap[]> {
    return (await nhaCungCapRepository.danhSach(loc)).map((d) => new NhaCungCap(d));
  }

  /** Lưu hồ sơ nhà cung cấp (thêm mới nếu maNCC = 0). */
  async luu(): Promise<boolean> {
    const { tenNCC, diaChi, maSoThue, nguoiLienHe, soDienThoai, trangThaiHopTac } = this;
    const data = { tenNCC, diaChi, maSoThue, nguoiLienHe, soDienThoai, trangThaiHopTac };
    Object.assign(this, this.maNCC ? await nhaCungCapRepository.capNhat(this.maNCC, data) : await nhaCungCapRepository.tao(data));
    return true;
  }
}
