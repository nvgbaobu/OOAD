// Kiểm thử nghiệp vụ Khuyến mãi (mã giảm giá, combo) trên DB thật. Chạy: npm run test:khuyen-mai (chạy xong tự seed lại)
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { LoiNghiepVu } from "../lib/loi";
import { khuyenMaiService, tinhTrang, type FormMa } from "../lib/services/khuyenMaiService";
import { posService } from "../lib/services/posService";
import { ngayInput } from "../lib/dinhDang";

let loi = 0;
const kiemTra = (dk: boolean, moTa: string) => { console.log(dk ? "  ✔" : "  ✘", moTa); if (!dk) loi++; };
async function phaiLoi(fn: () => Promise<unknown>, truong: string | null, chua: string) {
  try { await fn(); kiemTra(false, `phải báo lỗi "${chua}"`); }
  catch (e) {
    const msg = e instanceof LoiNghiepVu ? (truong ? e.loiTruong?.[truong] : e.message) ?? "" : String(e);
    kiemTra(e instanceof LoiNghiepVu && msg.includes(chua), `báo lỗi${truong ? ` ô ${truong}` : ""}: ${msg}`);
  }
}
const sauNgay = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return ngayInput(d); };
const sach = (isbn: string) => prisma.sach.findUniqueOrThrow({ where: { isbn } });

async function main() {
  const admin = 1, staff = 2;
  const mau: FormMa = { maCode: " he2026 ", loaiGiam: "PHAN_TRAM", giaTriGiam: "20", giaTriDonToiThieu: "100000", soLuongToiDa: "50", ngayBatDau: sauNgay(0), ngayKetThuc: sauNgay(0) };

  console.log("1. Thêm mã giảm giá");
  await phaiLoi(() => khuyenMaiService.taoMa({ ...mau, maCode: "a b" }, admin), "maCode", "3–30 ký tự");
  await phaiLoi(() => khuyenMaiService.taoMa({ ...mau, maCode: "giam10" }, admin), "maCode", "đã tồn tại");
  await phaiLoi(() => khuyenMaiService.taoMa({ ...mau, giaTriGiam: "120" }, admin), "giaTriGiam", "0 đến 100");
  await phaiLoi(() => khuyenMaiService.taoMa({ ...mau, loaiGiam: "SO_TIEN", giaTriGiam: "0" }, admin), "giaTriGiam", "> 0");
  await phaiLoi(() => khuyenMaiService.taoMa({ ...mau, ngayBatDau: sauNgay(2), ngayKetThuc: sauNgay(1) }, admin), "ngayKetThuc", "từ ngày bắt đầu");
  await phaiLoi(() => khuyenMaiService.taoMa({ ...mau, soLuongToiDa: "0" }, admin), "soLuongToiDa", "≥ 1");
  const he = await khuyenMaiService.taoMa(mau, admin);
  kiemTra(he.maCode === "HE2026" && he.ngayKetThuc.getHours() === 23 && tinhTrang(he) === "DANG_AP_DUNG", "mã viết hoa, hết hạn cuối ngày hôm nay → đang áp dụng");
  const tuongLai = await khuyenMaiService.taoMa({ ...mau, maCode: "SAPTOI", ngayBatDau: sauNgay(3), ngayKetThuc: sauNgay(10) }, admin);
  kiemTra(tinhTrang(tuongLai) === "CHUA_BAT_DAU", "mã bắt đầu sau 3 ngày → chưa bắt đầu");
  const dsChua = await khuyenMaiService.danhSachMa({ tinhTrang: "CHUA_BAT_DAU" });
  kiemTra(dsChua.length === 1 && dsChua[0].maCode === "SAPTOI", "lọc 'Chưa bắt đầu'");
  kiemTra((await khuyenMaiService.danhSachMa({ tinhTrang: "HET_HAN" })).some((m) => m.maCode === "TET2026")
    && (await khuyenMaiService.danhSachMa({ tinhTrang: "HET_LUOT" })).some((m) => m.maCode === "HETLUOT"), "lọc 'Hết hạn' (TET2026), 'Hết lượt' (HETLUOT)");

  console.log("2. Mã ở POS");
  const rungNaUy = await sach("9786042000007"); // 145.000đ
  await posService.themSach(staff, rungNaUy.maSach, 1);
  await phaiLoi(() => posService.apMaGiamGia(staff, "SAPTOI"), null, "chưa đến ngày");
  await posService.apMaGiamGia(staff, "HE2026");
  kiemTra((await posService.layGioHang(staff)).tien?.giamMa === 29000, "HE2026 giảm 20% × 145.000 = 29.000");
  const maHD = await posService.thanhToan(staff, "QUET_THE", null);
  const ct = (await khuyenMaiService.layMa(he.maMGG))!;
  kiemTra(ct.ma.daSuDung === 1 && ct.thongKe.soHoaDon === 1 && ct.thongKe.tongGiam === 29000 && ct.daDung, `thống kê: 1 HĐ (#${maHD}), tổng giảm 29.000`);

  console.log("3. Sửa / ngừng / xóa mã");
  const f = { ...mau, maCode: "HE2026" };
  await phaiLoi(() => khuyenMaiService.capNhatMa(he.maMGG, { ...f, maCode: "HE2027" }, admin), "maCode", "không đổi được");
  await phaiLoi(() => khuyenMaiService.capNhatMa(he.maMGG, { ...f, soLuongToiDa: "0" }, admin), "soLuongToiDa", "≥ 1");
  await khuyenMaiService.capNhatMa(he.maMGG, { ...f, giaTriGiam: "25", soLuongToiDa: "1" }, admin);
  kiemTra(tinhTrang((await khuyenMaiService.layMa(he.maMGG))!.ma) === "HET_LUOT", "đặt 1 lượt (đã dùng 1) → hết lượt");
  await khuyenMaiService.capNhatMa(he.maMGG, { ...f, giaTriGiam: "25", soLuongToiDa: "10" }, admin);
  await khuyenMaiService.doiTrangThaiMa(he.maMGG, false, admin);
  await posService.themSach(staff, rungNaUy.maSach, 1);
  await phaiLoi(() => posService.apMaGiamGia(staff, "HE2026"), null, "ngừng hoạt động");
  await khuyenMaiService.doiTrangThaiMa(he.maMGG, true, admin);
  await posService.apMaGiamGia(staff, "HE2026");
  kiemTra((await posService.layGioHang(staff)).tien?.giamMa === Math.round(145000 * 0.25), "hoạt động lại, mức mới 25% áp ngay cho đơn đang lập");
  await posService.huyDon(staff);
  await phaiLoi(() => khuyenMaiService.xoaMa(he.maMGG, admin), null, "đã được dùng");
  await phaiLoi(async () => khuyenMaiService.xoaMa((await prisma.maGiamGia.findUniqueOrThrow({ where: { maCode: "GIAM50K" } })).maMGG, admin), null, "5 lượt, 0 hóa đơn");
  await khuyenMaiService.xoaMa(tuongLai.maMGG, admin);
  kiemTra(!(await prisma.maGiamGia.findUnique({ where: { maCode: "SAPTOI" } })), "xóa mã chưa dùng");

  console.log("4. Combo");
  const chaGiau = await sach("9786042000010"); // 120.000
  const nghiGiau = await sach("9786042000011"); // 105.000
  const english = await sach("9786042000030"); // ngừng kinh doanh
  const c = (gia: string, dong: [number, number][]) => ({
    tenCombo: " Combo  làm giàu ", giaCombo: gia, ngayBatDau: sauNgay(0), ngayKetThuc: sauNgay(30),
    dong: dong.map(([m, sl]) => ({ maSach: String(m), soLuong: String(sl) })),
  });
  await phaiLoi(() => khuyenMaiService.luuCombo(null, c("100000", [[chaGiau.maSach, 1]]), admin), "dong", "ít nhất 2 cuốn");
  await phaiLoi(() => khuyenMaiService.luuCombo(null, c("225000", [[chaGiau.maSach, 1], [nghiGiau.maSach, 1]]), admin), "giaCombo", "thấp hơn tổng giá lẻ (225.000đ)");
  await phaiLoi(() => khuyenMaiService.luuCombo(null, c("300000", [[chaGiau.maSach, 1], [english.maSach, 1]]), admin), `dong.${english.maSach}`, "ngừng kinh doanh");
  const combo = await khuyenMaiService.luuCombo(null, c("190000", [[chaGiau.maSach, 1], [nghiGiau.maSach, 1]]), admin);
  kiemTra(combo.tenCombo === "Combo làm giàu", "thêm combo, chuẩn hóa tên");
  await posService.themSach(staff, chaGiau.maSach, 2);
  await posService.themSach(staff, nghiGiau.maSach, 1);
  kiemTra((await posService.layGioHang(staff)).tien?.giamCombo === 35000, "POS: 2 Cha giàu + 1 Nghĩ giàu = 1 bộ → giảm 35.000");
  await khuyenMaiService.luuCombo(combo.maCombo, c("200000", [[chaGiau.maSach, 1], [nghiGiau.maSach, 1]]), admin);
  kiemTra((await posService.layGioHang(staff)).tien?.giamCombo === 25000, "sửa giá combo 200.000 → giảm 25.000");
  await khuyenMaiService.doiTrangThaiCombo(combo.maCombo, false, admin);
  kiemTra((await posService.layGioHang(staff)).tien?.giamCombo === 0, "ngừng combo → không giảm");
  await posService.huyDon(staff);
  await khuyenMaiService.xoaCombo(combo.maCombo, admin);
  kiemTra(!(await prisma.combo.findUnique({ where: { maCombo: combo.maCombo } })) && (await prisma.chiTietCombo.count({ where: { maCombo: combo.maCombo } })) === 0, "xóa combo (chi tiết xóa theo)");

  console.log("5. Nhật ký");
  const nk = await prisma.nhatKyHeThong.groupBy({ by: ["module", "hanhDong"], where: { module: { in: ["MA_GIAM_GIA", "COMBO"] } }, _count: true });
  const dem = (m: string, h: string) => nk.find((x) => x.module === m && x.hanhDong === h)?._count ?? 0;
  kiemTra(dem("MA_GIAM_GIA", "THEM") === 2 && dem("MA_GIAM_GIA", "SUA") === 2 && dem("MA_GIAM_GIA", "NGUNG") === 1 && dem("MA_GIAM_GIA", "XOA") === 1
    && dem("COMBO", "THEM") === 1 && dem("COMBO", "SUA") === 1 && dem("COMBO", "XOA") === 1, "đủ nhật ký mã + combo");

  console.log(loi ? `\n✘ ${loi} kiểm tra thất bại` : "\n✔ Tất cả kiểm tra đạt");
  process.exitCode = loi ? 1 : 0;
}
main().finally(() => prisma.$disconnect());
