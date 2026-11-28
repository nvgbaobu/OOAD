// Lớp thực thể PhieuKiemKe (kế thừa PhieuKho) – Bảng 3.67 (thuộc tính), Bảng 3.68 (phương thức).
import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/db";
import type { PhieuKiemKe as PhieuKiemKeModel, ChiTietKiemKe as ChiTietKiemKeModel } from "@/lib/generated/prisma/client";
import { phieuKhoRepository } from "@/lib/repositories/phieuKhoRepository";
import { PhieuKho, type DuLieuXuLyPhieu } from "@/lib/thucThe/PhieuKho";
import { ChiTietKiemKe } from "@/lib/thucThe/ChiTietPhieuKho";
import type { Sach } from "@/lib/thucThe/Sach";

export class PhieuKiemKe extends PhieuKho implements PhieuKiemKeModel {
  // ───── Thuộc tính (maTKLap, maTKDuyet, ngayLap, ngayDuyet, trangThai, ghiChu, lyDoTuChoi kế thừa từ PhieuKho) ─────
  declare maPKK: number;
  declare chiTiets: ChiTietKiemKe[];

  constructor(duLieu: PhieuKiemKeModel & { chiTiets?: ChiTietKiemKeModel[] }) {
    super(duLieu);
    this.chiTiets = (duLieu.chiTiets ?? []).map((c) => new ChiTietKiemKe(c));
  }

  /** Phiếu mới (chưa lưu) do `maTKLap` lập. */
  static moi(maTKLap: number, ghiChu: string | null): PhieuKiemKe {
    return new PhieuKiemKe({ maPKK: 0, maTKLap, maTKDuyet: null, ngayLap: new Date(), ngayDuyet: null, trangThai: "", ghiChu, lyDoTuChoi: null });
  }

  /** Đối tượng chỉ biết mã phiếu – để duyệt/từ chối mà không cần đọc cả phiếu. */
  static thamChieu(maPKK: number): PhieuKiemKe {
    return Object.assign(Object.create(PhieuKiemKe.prototype) as PhieuKiemKe, { maPKK });
  }

  get ma() {
    return this.maPKK;
  }

  protected xuLy(db: Db, duLieu: DuLieuXuLyPhieu) {
    return phieuKhoRepository.xuLyKiemKe(db, this.maPKK, duLieu);
  }

  // ───── Phương thức ─────

  /** Thêm dòng kiểm kê: số lượng hệ thống = tồn kho của sách lúc lập, kèm số thực tế và lý do chênh lệch. */
  themChiTiet(sach: Pick<Sach, "maSach" | "soLuongTon">, slThucTe: number, lyDo: string | null): void {
    this.chiTiets.push(new ChiTietKiemKe({ maPKK: this.maPKK, maSach: sach.maSach, slHeThong: sach.soLuongTon, slThucTe, lyDoChenhLech: lyDo }));
  }

  /** Danh sách chi tiết để đối chiếu và cập nhật tồn kho khi duyệt. */
  layDanhSachChiTiet(): ChiTietKiemKe[] {
    return this.chiTiets;
  }

  /** Lưu phiếu mới (phải gửi duyệt trước). */
  async luu(db: Db = prisma): Promise<boolean> {
    if (this.trangThai !== "CHO_DUYET") throw new Error("Phiếu kiểm kê chưa gửi duyệt");
    const dong = this.chiTiets.map(({ maSach, slHeThong, slThucTe, lyDoChenhLech }) => ({ maSach, slHeThong, slThucTe, lyDoChenhLech }));
    const d = await phieuKhoRepository.taoKiemKe(db, this.maTKLap, this.ghiChu, dong, this.trangThai);
    this.maPKK = d.maPKK;
    this.ngayLap = d.ngayLap;
    return true;
  }

  /** Phiếu theo mã (kèm chi tiết). */
  static async timTheoMa(ma: number, db: Db = prisma): Promise<PhieuKiemKe | null> {
    const d = await phieuKhoRepository.layKiemKe(db, ma);
    return d && new PhieuKiemKe(d);
  }

  /** Các phiếu kiểm kê đang chờ duyệt. */
  static async layDanhSachChoDuyet(): Promise<PhieuKiemKe[]> {
    return (await phieuKhoRepository.danhSachKiemKe("CHO_DUYET")).map((d) => new PhieuKiemKe({ ...d, chiTiets: undefined }));
  }
}
