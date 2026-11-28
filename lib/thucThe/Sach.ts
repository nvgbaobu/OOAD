// Lớp thực thể Sach – Bảng 3.43 (thuộc tính), Bảng 3.44 (phương thức).
// Các phương thức đổi số lượng KHÔNG đọc-rồi-ghi trong bộ nhớ mà gọi 1 câu UPDATE có điều kiện
// (vd: WHERE soLuongTon - soLuongTamGiu >= n) → hai quầy bán cùng lúc cũng không bán vượt tồn.
import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/db";
import type { Prisma, Sach as SachModel } from "@/lib/generated/prisma/client";
import { sachRepository, type LocSach } from "@/lib/repositories/sachRepository";

export type TrangThaiSach = "DANG_BAN" | "NGUNG_KINH_DOANH";

export class Sach implements SachModel {
  // ───── Thuộc tính ─────
  declare maSach: number;
  declare isbn: string;
  declare tenSach: string;
  declare tacGia: string;
  declare nhaXuatBan: string | null;
  declare namXB: number | null;
  declare maTL: number;
  declare giaNhap: Prisma.Decimal;
  declare giaBan: Prisma.Decimal;
  declare hinhAnh: string | null;
  declare viTriKe: string | null;
  declare soLuongTon: number;
  declare soLuongTamGiu: number;
  declare dinhMucToiThieu: number;
  declare trangThai: string; // DANG_BAN | NGUNG_KINH_DOANH

  constructor(duLieu: SachModel) {
    Object.assign(this, duLieu);
  }

  /**
   * Đối tượng chỉ biết khóa chính (giống getReference của JPA) – dùng khi chỉ cần gọi phương thức cập nhật
   * (tạm giữ, trừ tồn...) mà không phải đọc cả bản ghi từ CSDL.
   */
  static thamChieu(maSach: number): Sach {
    return Object.assign(Object.create(Sach.prototype) as Sach, { maSach });
  }

  // ───── Phương thức ─────

  /** Số lượng có thể bán = tồn − tạm giữ (trong đơn chưa thanh toán). */
  soLuongKhaDung(): number {
    return this.soLuongTon - this.soLuongTamGiu;
  }

  /** Tạm giữ `sl` cuốn cho đơn đang lập. Trả về false nếu không đủ hàng hoặc sách đã ngừng kinh doanh. */
  async tamGiu(sl: number, db: Db = prisma): Promise<boolean> {
    const ok = await sachRepository.tangTamGiu(db, this.maSach, sl);
    if (ok && this.soLuongTamGiu !== undefined) this.soLuongTamGiu += sl;
    return ok;
  }

  /** Giải phóng `sl` cuốn đã tạm giữ (bớt sách khỏi đơn, hủy đơn). */
  async giaiPhong(sl: number, db: Db = prisma): Promise<boolean> {
    const ok = await sachRepository.giamTamGiu(db, this.maSach, sl);
    if (ok && this.soLuongTamGiu !== undefined) this.soLuongTamGiu -= sl;
    return ok;
  }

  /**
   * Trừ `sl` cuốn khỏi tồn kho.
   * - daTamGiu = true (thanh toán): số này đang được tạm giữ trong đơn → giải phóng tạm giữ cùng lúc.
   * - daTamGiu = false (duyệt xuất hủy, kiểm kê thiếu): chỉ trừ khi tồn sau khi trừ vẫn ≥ số đang tạm giữ.
   */
  async truTon(sl: number, db: Db = prisma, { daTamGiu = false } = {}): Promise<boolean> {
    const ok = daTamGiu ? await sachRepository.xuatBan(db, this.maSach, sl) : await sachRepository.dieuChinhTon(db, this.maSach, -sl);
    if (ok && this.soLuongTon !== undefined) {
      this.soLuongTon -= sl;
      if (daTamGiu) this.soLuongTamGiu -= sl;
    }
    return ok;
  }

  /** Cộng `sl` cuốn vào tồn kho (duyệt phiếu nhập, kiểm kê thừa, hủy hóa đơn đã thanh toán). */
  async congTon(sl: number, db: Db = prisma): Promise<boolean> {
    const ok = await sachRepository.dieuChinhTon(db, this.maSach, sl);
    if (ok && this.soLuongTon !== undefined) this.soLuongTon += sl;
    return ok;
  }

  /** Tồn kho đã chạm/dưới định mức tối thiểu → cảnh báo sắp hết hàng. */
  duoiDinhMuc(): boolean {
    return this.soLuongTon <= this.dinhMucToiThieu;
  }

  /** Cập nhật định mức tồn kho tối thiểu. */
  async capNhatDinhMuc(sl: number): Promise<void> {
    await sachRepository.datDinhMuc([this.maSach], sl);
    this.dinhMucToiThieu = sl;
  }

  /**
   * Chuyển trạng thái kinh doanh. Ngừng kinh doanh chỉ thành công khi không còn cuốn nào bị tạm giữ
   * trong đơn chưa thanh toán (UC2.4). Trả về false nếu không chuyển được.
   */
  async capNhatTrangThai(tt: TrangThaiSach): Promise<boolean> {
    if (tt === "NGUNG_KINH_DOANH") {
      if (!(await sachRepository.ngungKinhDoanhNeuKhongTamGiu(this.maSach))) return false;
    } else {
      await sachRepository.capNhat(this.maSach, { trangThai: tt });
    }
    this.trangThai = tt;
    return true;
  }

  /** ISBN đã có sách khác dùng chưa (bỏ qua chính sách đang sửa). */
  static async kiemTraTrungISBN(isbn: string, boQuaMaSach?: number): Promise<boolean> {
    const d = await sachRepository.timTheoIsbn(isbn);
    return !!d && d.maSach !== boQuaMaSach;
  }

  /** Tìm sách theo mã (kèm thể loại). */
  static async timTheoMa(ma: number, db: Db = prisma) {
    const d = await sachRepository.timTheoMa(db, ma);
    return d && Object.assign(new Sach(d), { theLoai: d.theLoai });
  }

  /** Tìm sách đang bán theo tên / ISBN / tác giả (POS). */
  static async timKiem(tuKhoa: string): Promise<Sach[]> {
    return (await sachRepository.timDeBan(tuKhoa)).map((d) => new Sach(d));
  }

  /** Lọc danh sách sách (màn hình Quản lý sách). */
  static async loc(loc: LocSach, boQua: number, lay: number): Promise<Sach[]> {
    return (await sachRepository.danhSach(loc, boQua, lay)).map((d) => new Sach(d));
  }

  /** Lưu thông tin sách vào CSDL (tồn kho không sửa ở đây – chỉ đổi qua phiếu kho có duyệt). */
  async luu(): Promise<boolean> {
    const { isbn, tenSach, tacGia, nhaXuatBan, namXB, maTL, giaNhap, giaBan, hinhAnh, viTriKe, dinhMucToiThieu } = this;
    const data = { isbn, tenSach, tacGia, nhaXuatBan, namXB, maTL, giaNhap, giaBan, hinhAnh, viTriKe, dinhMucToiThieu };
    if (this.maSach) await sachRepository.capNhat(this.maSach, data);
    else this.maSach = (await sachRepository.tao({ ...data, soLuongTon: 0, soLuongTamGiu: 0, trangThai: "DANG_BAN" })).maSach;
    return true;
  }
}
