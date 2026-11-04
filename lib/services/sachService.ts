// Nghiệp vụ quản lý sách và thể loại.
// - Tồn kho KHÔNG sửa ở đây: sách mới tồn = 0, kho chỉ đổi qua phiếu nhập / kiểm kê / xuất hủy (có duyệt).
// - Không xóa sách: chuyển "Ngừng kinh doanh" (ẩn khỏi POS, giữ dữ liệu cho hóa đơn cũ).
// - Giá bán ≥ giá nhập. Đổi giá/thuế suất chỉ ảnh hưởng đơn mới (chi tiết hóa đơn đã chụp giá lúc bán).
import { prisma } from "@/lib/prisma";
import { LoiNghiepVu } from "@/lib/loi";
import { sachRepository, type LocSach } from "@/lib/repositories/sachRepository";
import { theLoaiRepository } from "@/lib/repositories/theLoaiRepository";
import { nhatKyRepository } from "@/lib/repositories/nhatKyRepository";

export const SO_SACH_MOI_TRANG = 15;
export const TRANG_THAI_SACH = { DANG_BAN: "Đang bán", NGUNG_KINH_DOANH: "Ngừng kinh doanh" } as const;
export const THUE_SUAT_HOP_LE = [0, 5]; // 0% sách chính trị/giáo dục/văn hóa, 5% sách còn lại

/** Dữ liệu thô từ form (chuỗi). */
export type FormSach = Record<
  "isbn" | "tenSach" | "tacGia" | "nhaXuatBan" | "namXB" | "maTL" | "giaNhap" | "giaBan" | "viTriKe" | "dinhMucToiThieu" | "hinhAnh",
  string
>;

const soTien = (s: string) => Number(s.replace(/[.,\s]/g, ""));
const chuanHoa = (s: string) => s.trim().replace(/\s+/g, " ");

/** Kiểm tra + chuyển kiểu; gom mọi lỗi theo ô rồi ném 1 lần. */
async function kiemTraSach(f: FormSach, maSachDangSua?: number) {
  const loi: Record<string, string> = {};
  const isbn = f.isbn.replace(/[-\s]/g, "").toUpperCase();
  const tenSach = chuanHoa(f.tenSach);
  const tacGia = chuanHoa(f.tacGia);
  const nhaXuatBan = chuanHoa(f.nhaXuatBan) || null;
  const viTriKe = chuanHoa(f.viTriKe) || null;
  const hinhAnh = f.hinhAnh.trim() || null;
  const namXB = f.namXB.trim() ? Number(f.namXB) : null;
  const maTL = Number(f.maTL);
  const giaNhap = soTien(f.giaNhap);
  const giaBan = soTien(f.giaBan);
  const dinhMucToiThieu = f.dinhMucToiThieu.trim() ? Number(f.dinhMucToiThieu) : 5;

  if (!/^(\d{13}|\d{9}[\dX])$/.test(isbn)) loi.isbn = "ISBN gồm 10 hoặc 13 chữ số";
  if (!tenSach) loi.tenSach = "Nhập tên sách";
  else if (tenSach.length > 255) loi.tenSach = "Tên sách tối đa 255 ký tự";
  if (!tacGia) loi.tacGia = "Nhập tác giả";
  else if (tacGia.length > 150) loi.tacGia = "Tác giả tối đa 150 ký tự";
  if (nhaXuatBan && nhaXuatBan.length > 150) loi.nhaXuatBan = "Tối đa 150 ký tự";
  const namNay = new Date().getFullYear();
  if (namXB !== null && (!Number.isInteger(namXB) || namXB < 1900 || namXB > namNay + 1)) {
    loi.namXB = `Năm xuất bản từ 1900 đến ${namNay + 1}`;
  }
  if (!Number.isInteger(maTL) || !(await theLoaiRepository.timTheoMa(maTL))) loi.maTL = "Chọn thể loại";
  if (!f.giaNhap.trim() || !Number.isFinite(giaNhap) || giaNhap < 0) loi.giaNhap = "Giá nhập là số ≥ 0";
  if (!f.giaBan.trim() || !Number.isFinite(giaBan) || giaBan <= 0) loi.giaBan = "Giá bán là số > 0";
  else if (!loi.giaNhap && giaBan < giaNhap) loi.giaBan = "Giá bán phải ≥ giá nhập";
  if (!Number.isInteger(dinhMucToiThieu) || dinhMucToiThieu < 0) loi.dinhMucToiThieu = "Định mức là số nguyên ≥ 0";
  if (viTriKe && viTriKe.length > 50) loi.viTriKe = "Tối đa 50 ký tự";
  if (hinhAnh && !/^(https?:\/\/|\/)\S+$/.test(hinhAnh)) loi.hinhAnh = "Đường dẫn ảnh bắt đầu bằng http(s):// hoặc /";

  if (!loi.isbn) {
    const trung = await sachRepository.timTheoIsbn(isbn);
    if (trung && trung.maSach !== maSachDangSua) loi.isbn = `ISBN đã có: "${trung.tenSach}"`;
  }
  if (Object.keys(loi).length) throw new LoiNghiepVu("Dữ liệu chưa hợp lệ, kiểm tra các ô báo đỏ", loi);

  return { isbn, tenSach, tacGia, nhaXuatBan, namXB, maTL, giaNhap, giaBan, viTriKe, dinhMucToiThieu, hinhAnh };
}

export const sachService = {
  async danhSach(loc: LocSach, trang: number) {
    const tong = await sachRepository.dem(loc);
    const soTrang = Math.max(1, Math.ceil(tong / SO_SACH_MOI_TRANG));
    const trangHienTai = Math.min(Math.max(1, trang), soTrang);
    const sachs = await sachRepository.danhSach(loc, (trangHienTai - 1) * SO_SACH_MOI_TRANG, SO_SACH_MOI_TRANG);
    return { sachs, tong, soTrang, trang: trangHienTai };
  },

  layChiTiet: (maSach: number) => sachRepository.timTheoMa(prisma, maSach),

  async tao(f: FormSach, maTK: number) {
    const d = await kiemTraSach(f);
    const sach = await sachRepository.tao({ ...d, soLuongTon: 0, soLuongTamGiu: 0, trangThai: "DANG_BAN" });
    await nhatKyRepository.ghi({ maTK, module: "SACH", hanhDong: "THEM", noiDung: `#${sach.maSach} ${sach.tenSach} (ISBN ${sach.isbn})` });
    return sach;
  },

  async capNhat(maSach: number, f: FormSach, maTK: number) {
    const cu = await sachRepository.timTheoMa(prisma, maSach);
    if (!cu) throw new LoiNghiepVu("Sách không tồn tại");
    const d = await kiemTraSach(f, maSach);
    await sachRepository.capNhat(maSach, d);
    const thayDoi = (["giaNhap", "giaBan"] as const)
      .filter((k) => Number(cu[k]) !== d[k])
      .map((k) => `${k}: ${Number(cu[k])} → ${d[k]}`);
    await nhatKyRepository.ghi({
      maTK, module: "SACH", hanhDong: "SUA", noiDung: `#${maSach} ${d.tenSach}${thayDoi.length ? ` (${thayDoi.join(", ")})` : ""}`,
    });
  },

  async doiTrangThai(maSach: number, trangThai: keyof typeof TRANG_THAI_SACH, maTK: number) {
    const cu = await sachRepository.timTheoMa(prisma, maSach);
    if (!cu) throw new LoiNghiepVu("Sách không tồn tại");
    if (cu.trangThai === trangThai) return;
    await sachRepository.capNhat(maSach, { trangThai });
    await nhatKyRepository.ghi({
      maTK, module: "SACH", hanhDong: trangThai === "DANG_BAN" ? "MO_BAN_LAI" : "NGUNG_KINH_DOANH",
      noiDung: `#${maSach} ${cu.tenSach}${cu.soLuongTamGiu ? ` (đang có ${cu.soLuongTamGiu} cuốn trong đơn chưa thanh toán)` : ""}`,
    });
  },

  // ───────── Thể loại ─────────

  danhSachTheLoai: () => theLoaiRepository.tatCa(),
  danhSachTheLoaiKemSoSach: () => theLoaiRepository.tatCaKemSoSach(),

  async luuTheLoai(maTL: number | null, tenTLTho: string, thueSuatTho: string, maTK: number) {
    const tenTL = chuanHoa(tenTLTho);
    const thueSuatVAT = Number(thueSuatTho);
    const loi: Record<string, string> = {};
    if (!tenTL) loi.tenTL = "Nhập tên thể loại";
    else if (tenTL.length > 100) loi.tenTL = "Tối đa 100 ký tự";
    else {
      const trung = await theLoaiRepository.timTheoTen(tenTL);
      if (trung && trung.maTL !== maTL) loi.tenTL = "Tên thể loại đã tồn tại";
    }
    if (!THUE_SUAT_HOP_LE.includes(thueSuatVAT)) loi.thueSuatVAT = "Thuế suất 0% hoặc 5%";
    if (Object.keys(loi).length) throw new LoiNghiepVu(Object.values(loi).join(". "), loi);

    if (maTL === null) {
      const tl = await theLoaiRepository.tao(tenTL, thueSuatVAT);
      await nhatKyRepository.ghi({ maTK, module: "THE_LOAI", hanhDong: "THEM", noiDung: `${tenTL} (VAT ${thueSuatVAT}%)` });
      return tl;
    }
    const cu = await theLoaiRepository.timTheoMa(maTL);
    if (!cu) throw new LoiNghiepVu("Thể loại không tồn tại");
    const tl = await theLoaiRepository.capNhat(maTL, tenTL, thueSuatVAT);
    await nhatKyRepository.ghi({
      maTK, module: "THE_LOAI", hanhDong: "SUA",
      noiDung: `${cu.tenTL} → ${tenTL}, VAT ${Number(cu.thueSuatVAT)}% → ${thueSuatVAT}%`,
    });
    return tl;
  },

  async xoaTheLoai(maTL: number, maTK: number) {
    const tl = await theLoaiRepository.timTheoMa(maTL);
    if (!tl) throw new LoiNghiepVu("Thể loại không tồn tại");
    const soSach = await theLoaiRepository.demSach(maTL);
    if (soSach > 0) throw new LoiNghiepVu(`Không xóa được: "${tl.tenTL}" đang có ${soSach} sách`);
    await theLoaiRepository.xoa(maTL);
    await nhatKyRepository.ghi({ maTK, module: "THE_LOAI", hanhDong: "XOA", noiDung: tl.tenTL });
  },
};
