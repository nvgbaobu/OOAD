// Nghiệp vụ khuyến mãi: mã giảm giá và combo (chỉ Admin quản lý; Staff xem danh sách để tư vấn khách).
// Mã giảm giá:
// - maCode viết HOA, 3–30 ký tự A-Z 0-9 _ -, duy nhất. PHAN_TRAM: 0 < giá trị ≤ 100; SO_TIEN: > 0 (đồng).
// - Ngày áp dụng theo ngày: từ 0:00 ngày bắt đầu đến 23:59:59 ngày kết thúc. Số lượt tối đa ≥ số lượt đã dùng.
// - Mã đã dùng (daSuDung > 0 hoặc đã gắn vào hóa đơn, kể cả đơn nháp) thì không đổi maCode và không xóa – chỉ "Ngừng hoạt động".
// - Đổi giá trị mã chỉ ảnh hưởng đơn chưa thanh toán (hóa đơn đã lưu số tiền giảm). POS kiểm tra lại mã khi thanh toán.
// Combo:
// - ≥ 1 đầu sách đang bán, tổng số cuốn ≥ 2, SL mỗi sách 1–20; giá combo > 0 và < tổng giá lẻ hiện tại.
// - Hóa đơn không tham chiếu combo (chỉ lưu giamCombo) → combo xóa được; sửa combo chỉ ảnh hưởng đơn mới.
import { LoiNghiepVu } from "@/lib/loi";
import { maGiamGiaRepository, type TinhTrangMa } from "@/lib/repositories/maGiamGiaRepository";
import { comboRepository } from "@/lib/repositories/comboRepository";
import { docNgayInput } from "@/lib/dinhDang";
import { Combo } from "@/lib/entities/Combo";
import { MaGiamGia } from "@/lib/entities/MaGiamGia";
import { sachRepository } from "@/lib/repositories/sachRepository";
import { NhatKyHeThong } from "@/lib/entities/NhatKyHeThong";

export const TINH_TRANG_MA: Record<TinhTrangMa, string> = {
  DANG_AP_DUNG: "Đang áp dụng", CHUA_BAT_DAU: "Chưa bắt đầu", HET_HAN: "Hết hạn", HET_LUOT: "Hết lượt", NGUNG: "Ngừng hoạt động",
};
export const LOAI_GIAM = { PHAN_TRAM: "Giảm theo %", SO_TIEN: "Giảm số tiền" } as const;

type CoHieuLuc = { trangThai: string; ngayBatDau: Date; ngayKetThuc: Date };
/** Tình trạng hiện tại của mã / combo (combo không có lượt dùng). */
export function tinhTrang(x: CoHieuLuc & { daSuDung?: number; soLuongToiDa?: number }, luc = new Date()): TinhTrangMa {
  if (x.trangThai !== "HOAT_DONG") return "NGUNG";
  if (luc < x.ngayBatDau) return "CHUA_BAT_DAU";
  if (luc > x.ngayKetThuc) return "HET_HAN";
  if (x.soLuongToiDa !== undefined && (x.daSuDung ?? 0) >= x.soLuongToiDa) return "HET_LUOT";
  return "DANG_AP_DUNG";
}

export type FormMa = Record<"maCode" | "loaiGiam" | "giaTriGiam" | "giaTriDonToiThieu" | "soLuongToiDa" | "ngayBatDau" | "ngayKetThuc", string>;
export type FormCombo = { tenCombo: string; giaCombo: string; ngayBatDau: string; ngayKetThuc: string; dong: { maSach: string; soLuong: string }[] };

const soTien = (s: string) => (s.trim() === "" ? NaN : Number(s.replace(/[.,\s]/g, "")));
const vnd = (n: number) => `${n.toLocaleString("vi-VN")}đ`;

function kiemTraNgay(f: { ngayBatDau: string; ngayKetThuc: string }, loi: Record<string, string>) {
  const ngayBatDau = docNgayInput(f.ngayBatDau);
  const ngayKetThuc = docNgayInput(f.ngayKetThuc, true);
  if (!ngayBatDau) loi.ngayBatDau = "Chọn ngày bắt đầu";
  if (!ngayKetThuc) loi.ngayKetThuc = "Chọn ngày kết thúc";
  else if (ngayBatDau && ngayKetThuc < ngayBatDau) loi.ngayKetThuc = "Ngày kết thúc phải từ ngày bắt đầu trở đi";
  return { ngayBatDau: ngayBatDau!, ngayKetThuc: ngayKetThuc! };
}

async function kiemTraMa(f: FormMa, cu: { maMGG: number; maCode: string; daSuDung: number } | null, khoaMaCode: boolean) {
  const loi: Record<string, string> = {};
  const maCode = f.maCode.trim().toUpperCase();
  const loaiGiam = f.loaiGiam === "PHAN_TRAM" || f.loaiGiam === "SO_TIEN" ? f.loaiGiam : null;
  const giaTriGiam = loaiGiam === "PHAN_TRAM" ? Number(f.giaTriGiam.trim() || NaN) : soTien(f.giaTriGiam);
  const giaTriDonToiThieu = f.giaTriDonToiThieu.trim() === "" ? 0 : soTien(f.giaTriDonToiThieu);
  const soLuongToiDa = f.soLuongToiDa.trim() === "" ? NaN : Number(f.soLuongToiDa);

  if (khoaMaCode && cu && maCode !== cu.maCode) loi.maCode = "Mã đã được dùng – không đổi được";
  else if (!/^[A-Z0-9_-]{3,30}$/.test(maCode)) loi.maCode = "3–30 ký tự: chữ không dấu, số, _ hoặc -";
  else {
    const trung = await MaGiamGia.timTheoMaCode(maCode);
    if (trung && trung.maMGG !== cu?.maMGG) loi.maCode = `Mã giảm giá đã tồn tại (${maCode})`;
  }
  if (!loaiGiam) loi.loaiGiam = "Chọn loại giảm";
  else if (loaiGiam === "PHAN_TRAM" && (!Number.isFinite(giaTriGiam) || giaTriGiam <= 0 || giaTriGiam > 100 || Math.round(giaTriGiam * 100) !== giaTriGiam * 100)) {
    loi.giaTriGiam = "Phần trăm từ 0 đến 100 (tối đa 2 số lẻ)";
  } else if (loaiGiam === "SO_TIEN" && (!Number.isInteger(giaTriGiam) || giaTriGiam <= 0)) loi.giaTriGiam = "Số tiền giảm là số nguyên > 0";
  if (!Number.isInteger(giaTriDonToiThieu) || giaTriDonToiThieu < 0) loi.giaTriDonToiThieu = "Đơn tối thiểu là số tiền ≥ 0";
  if (!Number.isInteger(soLuongToiDa) || soLuongToiDa < 1) loi.soLuongToiDa = "Số lượt là số nguyên ≥ 1";
  else if (cu && soLuongToiDa < cu.daSuDung) loi.soLuongToiDa = `Đã dùng ${cu.daSuDung} lượt – không đặt thấp hơn`;
  const ngay = kiemTraNgay(f, loi);
  if (Object.keys(loi).length) throw new LoiNghiepVu("Dữ liệu chưa hợp lệ, kiểm tra các ô báo đỏ", loi);
  return { maCode, loaiGiam: loaiGiam!, giaTriGiam, giaTriDonToiThieu, soLuongToiDa, ...ngay };
}

async function kiemTraCombo(f: FormCombo) {
  const loi: Record<string, string> = {};
  const tenCombo = f.tenCombo.trim().replace(/\s+/g, " ");
  const giaCombo = soTien(f.giaCombo);
  if (!tenCombo) loi.tenCombo = "Nhập tên combo";
  else if (tenCombo.length > 150) loi.tenCombo = "Tối đa 150 ký tự";
  const ngay = kiemTraNgay(f, loi);

  const dong = f.dong.map((d) => ({ maSach: Number(d.maSach), soLuong: Number(d.soLuong) }));
  if (new Set(dong.map((d) => d.maSach)).size !== dong.length) throw new LoiNghiepVu("Mỗi sách chỉ 1 dòng trong combo");
  const sachs = new Map((await sachRepository.timNhieu(dong.map((d) => d.maSach))).map((s) => [s.maSach, s]));
  for (const d of dong) {
    const s = sachs.get(d.maSach);
    const k = `dong.${d.maSach}`;
    if (!s) throw new LoiNghiepVu("Có sách không tồn tại");
    if (s.trangThai !== "DANG_BAN") loi[k] = "Sách đã ngừng kinh doanh";
    else if (!Number.isInteger(d.soLuong) || d.soLuong < 1 || d.soLuong > 20) loi[k] = "Số lượng 1–20";
  }
  // UC8.2 luồng 3a: combo phải gồm ít nhất 2 đầu sách khác nhau
  if (dong.length < 2) loi.dong = "Combo phải có ít nhất 2 đầu sách";
  // Giá lẻ = Σ (SL × giá bán hiện tại) – tính bằng lớp Combo / ChiTietCombo
  const combo = Combo.moi({ tenCombo });
  for (const d of dong) combo.themChiTiet(sachs.get(d.maSach)!, d.soLuong || 0);
  const giaLe = combo.tinhTongGiaLe();
  if (!Number.isInteger(giaCombo) || giaCombo <= 0) loi.giaCombo = "Giá combo là số tiền > 0";
  else if (!loi.dong && giaCombo >= giaLe) loi.giaCombo = `Giá Combo không có ưu đãi – phải thấp hơn tổng giá lẻ (${vnd(giaLe)})`;
  if (Object.keys(loi).length) throw new LoiNghiepVu("Dữ liệu chưa hợp lệ, kiểm tra các ô báo đỏ", loi);
  return { tenCombo, giaCombo, ...ngay, dong, giaLe, combo };
}

export const khuyenMaiService = {
  // ───────── Mã giảm giá ─────────
  danhSachMa: (loc: { tuKhoa?: string; tinhTrang?: TinhTrangMa }) => maGiamGiaRepository.danhSach(loc),

  async layMa(maMGG: number) {
    const ma = await maGiamGiaRepository.timTheoMa(maMGG);
    if (!ma) return null;
    const [thongKe, soHoaDon] = await Promise.all([maGiamGiaRepository.thongKe(maMGG), maGiamGiaRepository.demHoaDon(maMGG)]);
    return { ma, thongKe, daDung: soHoaDon > 0 || ma.daSuDung > 0 };
  },

  async taoMa(f: FormMa, maTK: number) {
    const d = await kiemTraMa(f, null, false);
    const ma = MaGiamGia.moi(d);
    await ma.luu();
    await NhatKyHeThong.ghiNhatKy({ maTK, module: "MA_GIAM_GIA", hanhDong: "THEM", noiDung: moTaMa(d) });
    return ma;
  },

  async capNhatMa(maMGG: number, f: FormMa, maTK: number) {
    const ma = await MaGiamGia.timTheoMa(maMGG);
    if (!ma) throw new LoiNghiepVu("Mã giảm giá không tồn tại");
    const moTaCu = moTaMa(ma);
    const d = await kiemTraMa(f, ma, await ma.daDung());
    Object.assign(ma, d);
    await ma.luu();
    await NhatKyHeThong.ghiNhatKy({ maTK, module: "MA_GIAM_GIA", hanhDong: "SUA", noiDung: `${moTaCu} → ${moTaMa(d)}` });
  },

  async doiTrangThaiMa(maMGG: number, hoatDong: boolean, maTK: number) {
    const ma = await MaGiamGia.timTheoMa(maMGG);
    if (!ma) throw new LoiNghiepVu("Mã giảm giá không tồn tại");
    await ma.doiTrangThai(hoatDong);
    await NhatKyHeThong.ghiNhatKy({ maTK, module: "MA_GIAM_GIA", hanhDong: hoatDong ? "MO_LAI" : "NGUNG", noiDung: ma.maCode });
  },

  async xoaMa(maMGG: number, maTK: number) {
    const ma = await MaGiamGia.timTheoMa(maMGG);
    if (!ma) throw new LoiNghiepVu("Mã giảm giá không tồn tại");
    const n = await maGiamGiaRepository.demHoaDon(maMGG);
    if (n || ma.daSuDung) throw new LoiNghiepVu(`Không xóa được: mã đã được dùng (${ma.daSuDung} lượt, ${n} hóa đơn). Hãy chuyển "Ngừng hoạt động".`);
    await ma.xoa();
    await NhatKyHeThong.ghiNhatKy({ maTK, module: "MA_GIAM_GIA", hanhDong: "XOA", noiDung: ma.maCode });
  },

  // ───────── Combo ─────────
  danhSachCombo: () => comboRepository.danhSach(),
  /** Sách đang bán để chọn vào combo (Decimal → number cho client component). */
  sachDeChon: async () =>
    (await sachRepository.dangBanDeChon()).map((s) => ({ ...s, giaBan: Number(s.giaBan) })),
  layCombo: (maCombo: number) => comboRepository.timTheoMa(maCombo),

  async luuCombo(maCombo: number | null, f: FormCombo, maTK: number) {
    const d = await kiemTraCombo(f);
    const combo = Object.assign(d.combo, {
      maCombo: maCombo ?? 0, giaCombo: d.giaCombo, ngayBatDau: d.ngayBatDau, ngayKetThuc: d.ngayKetThuc,
    });
    if (!(await combo.luu())) throw new LoiNghiepVu("Combo không tồn tại");
    await NhatKyHeThong.ghiNhatKy({
      maTK, module: "COMBO", hanhDong: maCombo === null ? "THEM" : "SUA",
      noiDung: `#${combo.maCombo} ${d.tenCombo}: ${vnd(d.giaCombo)} (giá lẻ ${vnd(d.giaLe)}), ${d.dong.length} sách`,
    });
    return combo;
  },

  async doiTrangThaiCombo(maCombo: number, hoatDong: boolean, maTK: number) {
    const c = await Combo.timTheoMa(maCombo);
    if (!c) throw new LoiNghiepVu("Combo không tồn tại");
    await c.doiTrangThai(hoatDong);
    await NhatKyHeThong.ghiNhatKy({ maTK, module: "COMBO", hanhDong: hoatDong ? "MO_LAI" : "NGUNG", noiDung: `#${maCombo} ${c.tenCombo}` });
  },

  async xoaCombo(maCombo: number, maTK: number) {
    const c = await Combo.timTheoMa(maCombo);
    if (!c) throw new LoiNghiepVu("Combo không tồn tại");
    await c.xoa(); // ChiTietCombo xóa theo (CASCADE)
    await NhatKyHeThong.ghiNhatKy({ maTK, module: "COMBO", hanhDong: "XOA", noiDung: `#${maCombo} ${c.tenCombo}` });
  },
};

function moTaMa(m: { maCode: string; loaiGiam: string; giaTriGiam: number | { toString(): string }; soLuongToiDa: number }) {
  const gt = Number(m.giaTriGiam);
  return `${m.maCode} (${m.loaiGiam === "PHAN_TRAM" ? `${gt}%` : vnd(gt)}, ${m.soLuongToiDa} lượt)`;
}
