// Lớp thực thể PhieuXuatHuy (kế thừa PhieuKho) – Bảng 3.69 (thuộc tính), Bảng 3.70 (phương thức).
import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/db";
import type { PhieuXuatHuy as PhieuXuatHuyModel, ChiTietXuatHuy as ChiTietXuatHuyModel } from "@/lib/generated/prisma/client";
import { phieuKhoRepository } from "@/lib/repositories/phieuKhoRepository";
import { PhieuKho, type DuLieuXuLyPhieu } from "@/lib/thucThe/PhieuKho";
import { ChiTietXuatHuy } from "@/lib/thucThe/ChiTietPhieuKho";
import type { Sach } from "@/lib/thucThe/Sach";

export class PhieuXuatHuy extends PhieuKho implements PhieuXuatHuyModel {
  // ───── Thuộc tính (maTKLap, maTKDuyet, ngayLap, ngayDuyet, trangThai, ghiChu, lyDoTuChoi kế thừa từ PhieuKho) ─────
  declare maPXH: number;
  declare chiTiets: ChiTietXuatHuy[];

  constructor(duLieu: PhieuXuatHuyModel & { chiTiets?: ChiTietXuatHuyModel[] }) {
    super(duLieu);
    this.chiTiets = (duLieu.chiTiets ?? []).map((c) => new ChiTietXuatHuy(c));
  }

  /** Phiếu mới (chưa lưu) do `maTKLap` lập. */
  static moi(maTKLap: number, ghiChu: string | null): PhieuXuatHuy {
    return new PhieuXuatHuy({ maPXH: 0, maTKLap, maTKDuyet: null, ngayLap: new Date(), ngayDuyet: null, trangThai: "", ghiChu, lyDoTuChoi: null });
  }

  /** Đối tượng chỉ biết mã phiếu – để duyệt/từ chối mà không cần đọc cả phiếu. */
  static thamChieu(maPXH: number): PhieuXuatHuy {
    return Object.assign(Object.create(PhieuXuatHuy.prototype) as PhieuXuatHuy, { maPXH });
  }

  get ma() {
    return this.maPXH;
  }

  protected xuLy(db: Db, duLieu: DuLieuXuLyPhieu) {
    return phieuKhoRepository.xuLyXuatHuy(db, this.maPXH, duLieu);
  }

  // ───── Phương thức ─────

  /** Thêm dòng sách cần xuất hủy kèm số lượng và lý do hủy. */
  themChiTiet(sach: Pick<Sach, "maSach">, slHuy: number, lyDo: string): void {
    this.chiTiets.push(new ChiTietXuatHuy({ maPXH: this.maPXH, maSach: sach.maSach, soLuong: slHuy, lyDo }));
  }

  /** Danh sách chi tiết để trừ tồn kho khi duyệt. */
  layDanhSachChiTiet(): ChiTietXuatHuy[] {
    return this.chiTiets;
  }

  /** Lưu phiếu mới (phải gửi duyệt trước). */
  async luu(db: Db = prisma): Promise<boolean> {
    if (this.trangThai !== "CHO_DUYET") throw new Error("Phiếu xuất hủy chưa gửi duyệt");
    const dong = this.chiTiets.map((c) => ({ maSach: c.maSach, soLuong: c.soLuong, lyDo: c.lyDo ?? "" }));
    const d = await phieuKhoRepository.taoXuatHuy(db, this.maTKLap, this.ghiChu, dong, this.trangThai);
    this.maPXH = d.maPXH;
    this.ngayLap = d.ngayLap;
    return true;
  }

  /** Phiếu theo mã (kèm chi tiết). */
  static async timTheoMa(ma: number, db: Db = prisma): Promise<PhieuXuatHuy | null> {
    const d = await phieuKhoRepository.layXuatHuy(db, ma);
    return d && new PhieuXuatHuy(d);
  }

  /** Các phiếu xuất hủy đang chờ duyệt. */
  static async layDanhSachChoDuyet(): Promise<PhieuXuatHuy[]> {
    return (await phieuKhoRepository.danhSachXuatHuy("CHO_DUYET")).map((d) => new PhieuXuatHuy({ ...d, chiTiets: undefined }));
  }
}
