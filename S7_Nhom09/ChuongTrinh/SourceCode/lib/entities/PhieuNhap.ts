// Lớp thực thể PhieuNhap (kế thừa PhieuKho) – Bảng 3.65 (thuộc tính), Bảng 3.66 (phương thức).
import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import type { PhieuNhap as PhieuNhapModel, ChiTietPhieuNhap as ChiTietPhieuNhapModel } from "@/lib/generated/prisma/client";
import { phieuKhoRepository } from "@/lib/repositories/phieuKhoRepository";
import { PhieuKho, type DuLieuXuLyPhieu } from "@/lib/entities/PhieuKho";
import { ChiTietPhieuNhap } from "@/lib/entities/ChiTietPhieuKho";
import type { NhaCungCap } from "@/lib/entities/NhaCungCap";
import type { Sach } from "@/lib/entities/Sach";

export class PhieuNhap extends PhieuKho implements PhieuNhapModel {
  // ───── Thuộc tính (maTKLap, maTKDuyet, ngayLap, ngayDuyet, trangThai, ghiChu, lyDoTuChoi kế thừa từ PhieuKho) ─────
  declare maPN: number;
  declare maNCC: number;
  declare tongTien: Prisma.Decimal;
  declare chiTiets: ChiTietPhieuNhap[];

  constructor(duLieu: PhieuNhapModel & { chiTiets?: ChiTietPhieuNhapModel[] }) {
    super(duLieu);
    this.chiTiets = (duLieu.chiTiets ?? []).map((c) => new ChiTietPhieuNhap(c));
  }

  /** Phiếu mới (chưa lưu) do `maTKLap` lập. */
  static moi(maTKLap: number, ghiChu: string | null): PhieuNhap {
    return new PhieuNhap({
      maPN: 0, maNCC: 0, maTKLap, maTKDuyet: null, ngayLap: new Date(), ngayDuyet: null,
      trangThai: "", tongTien: new Prisma.Decimal(0), ghiChu, lyDoTuChoi: null,
    });
  }

  /** Đối tượng chỉ biết mã phiếu – để duyệt/từ chối mà không cần đọc cả phiếu. */
  static thamChieu(maPN: number): PhieuNhap {
    return Object.assign(Object.create(PhieuNhap.prototype) as PhieuNhap, { maPN });
  }

  get ma() {
    return this.maPN;
  }

  protected xuLy(db: Db, duLieu: DuLieuXuLyPhieu) {
    return phieuKhoRepository.xuLyPhieuNhap(db, this.maPN, duLieu);
  }

  // ───── Phương thức ─────

  /** Gắn nhà cung cấp cho phiếu. Trả về false (không gắn) nếu nhà cung cấp đã ngừng giao dịch. */
  ganNhaCungCap(ncc: NhaCungCap): boolean {
    if (!ncc.dangGiaoDich()) return false;
    this.maNCC = ncc.maNCC;
    return true;
  }

  /** Thêm dòng sách: số lượng nhập và giá nhập. */
  themChiTiet(sach: Pick<Sach, "maSach">, sl: number, gia: number): void {
    this.chiTiets.push(new ChiTietPhieuNhap({ maPN: this.maPN, maSach: sach.maSach, soLuong: sl, giaNhap: new Prisma.Decimal(gia) }));
  }

  /** Sửa số lượng thực nhận của một sách (phiếu còn Chờ duyệt) rồi tính lại tổng tiền. */
  async capNhatSoLuong(maSach: number, sl: number, db: Db = prisma): Promise<boolean> {
    const dong = this.chiTiets.find((c) => c.maSach === maSach);
    if (!dong || !(await dong.capNhatSoLuong(sl, db))) return false;
    this.tongTien = new Prisma.Decimal(await phieuKhoRepository.tinhLaiTongTienNhap(db, this.maPN));
    return true;
  }

  /** Tổng giá trị phiếu = Σ thành tiền các dòng. */
  tinhTongTien(): number {
    return this.chiTiets.reduce((t, c) => t + c.thanhTien(), 0);
  }

  /** Danh sách chi tiết của phiếu. */
  layDanhSachChiTiet(): ChiTietPhieuNhap[] {
    return this.chiTiets;
  }

  /** Lưu phiếu mới (phải gửi duyệt trước). */
  async luu(db: Db = prisma): Promise<boolean> {
    if (this.trangThai !== "CHO_DUYET") throw new Error("Phiếu nhập chưa gửi duyệt");
    const dong = this.chiTiets.map((c) => ({ maSach: c.maSach, soLuong: c.soLuong, giaNhap: Number(c.giaNhap) }));
    const d = await phieuKhoRepository.taoPhieuNhap(db, this.maTKLap, this.maNCC, this.ghiChu, this.tinhTongTien(), dong, this.trangThai);
    this.maPN = d.maPN;
    this.ngayLap = d.ngayLap;
    this.tongTien = d.tongTien;
    return true;
  }

  /** Phiếu theo mã (kèm chi tiết). */
  static async timTheoMa(ma: number, db: Db = prisma): Promise<PhieuNhap | null> {
    const d = await phieuKhoRepository.layPhieuNhap(db, ma);
    return d && new PhieuNhap(d);
  }

  /** Các phiếu nhập đang chờ duyệt. */
  static async layDanhSachChoDuyet(): Promise<PhieuNhap[]> {
    return (await phieuKhoRepository.danhSachPhieuNhap("CHO_DUYET")).map((d) => new PhieuNhap(d));
  }
}
