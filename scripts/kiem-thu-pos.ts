// Kịch bản kiểm thử nghiệp vụ POS trên DB thật. Chạy: npx tsx scripts/kiem-thu-pos.ts  (sau đó chạy lại seed)
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { posService, LoiPOS, LY_DO_HUY } from "../lib/services/posService";

const sach = (isbn: string) => prisma.sach.findUniqueOrThrow({ where: { isbn } });
let loi = 0;
const kiemTra = (dk: boolean, moTa: string) => { console.log(dk ? "  ✔" : "  ✘", moTa); if (!dk) loi++; };
async function phaiLoi(fn: () => Promise<unknown>, chua: string) {
  try { await fn(); kiemTra(false, `phải báo lỗi "${chua}"`); }
  catch (e) { kiemTra(e instanceof LoiPOS && e.message.includes(chua), `báo lỗi: ${(e as Error).message}`); }
}

async function main() {
  const maTK = 2; // staff Lê Hoàng An
  const sapiens = await sach("9786042000021"); // Lịch sử 0%, 219.000
  const dacNhanTam = await sach("9786042000013"); // Kỹ năng 5%, 88.000
  const hoangTuBe = await sach("9786042000018"); // tồn 2
  const englishGrammar = await sach("9786042000030"); // ngừng kinh doanh

  console.log("1. Thêm sách / tạm giữ");
  await posService.themSach(maTK, sapiens.maSach);
  await posService.themSach(maTK, dacNhanTam.maSach, 2);
  kiemTra((await sach(sapiens.isbn)).soLuongTamGiu === 1, "Sapiens tạm giữ 1");
  kiemTra((await sach(dacNhanTam.isbn)).soLuongTamGiu === 2, "Đắc nhân tâm tạm giữ 2");
  await phaiLoi(() => posService.themSach(maTK, hoangTuBe.maSach, 3), "chỉ còn 2");
  await phaiLoi(() => posService.themSach(maTK, englishGrammar.maSach), "ngừng kinh doanh");
  await posService.capNhatSoLuong(maTK, dacNhanTam.maSach, 1);
  kiemTra((await sach(dacNhanTam.isbn)).soLuongTamGiu === 1, "giảm SL → tạm giữ còn 1");
  await posService.capNhatSoLuong(maTK, dacNhanTam.maSach, 2);

  console.log("2. Khách hàng, mã, điểm");
  await phaiLoi(() => posService.chonKhachHang(maTK, "0999999999"), "Không tìm thấy");
  await posService.chonKhachHang(maTK, "0933333333"); // Lê Thu Hà – Vàng 10%, 1500 điểm
  await phaiLoi(() => posService.apMaGiamGia(maTK, "TET2026"), "hết hạn");
  await phaiLoi(() => posService.apMaGiamGia(maTK, "HETLUOT"), "hết lượt");
  await phaiLoi(() => posService.apMaGiamGia(maTK, "KHONGCO"), "không tồn tại");
  await posService.apMaGiamGia(maTK, "GIAM10");
  await phaiLoi(() => posService.datDiemSuDung(maTK, 5000), "không đủ điểm");
  await posService.datDiemSuDung(maTK, 50);
  const { tien } = await posService.layGioHang(maTK);
  console.log("  ", tien);
  kiemTra(tien!.tongTien === 275964, "tổng 275.964 (khớp ví dụ đã tính tay)");

  console.log("3. Thanh toán");
  await phaiLoi(() => posService.thanhToan(maTK, "TIEN_MAT", 200000), "chưa đủ");
  const khTruoc = await prisma.khachHang.findUniqueOrThrow({ where: { soDienThoai: "0933333333" } });
  const maGGTruoc = await prisma.maGiamGia.findUniqueOrThrow({ where: { maCode: "GIAM10" } });
  const maHD = await posService.thanhToan(maTK, "TIEN_MAT", 300000);
  const hd = await prisma.hoaDon.findUniqueOrThrow({ where: { maHD } });
  kiemTra(hd.trangThai === "DA_THANH_TOAN" && Number(hd.tongTien) === 275964 && hd.diemCong === 27, "HĐ đã thanh toán, điểm cộng 27");
  kiemTra(Number(hd.giamHangThe) === 39500 && Number(hd.giamMaGiamGia) === 35550 && Number(hd.giamDiem) === 50000 && Number(hd.giamCombo) === 0, "HĐ lưu tách 4 khoản giảm");
  const s1 = await sach(sapiens.isbn);
  kiemTra(s1.soLuongTon === sapiens.soLuongTon - 1 && s1.soLuongTamGiu === 0, "Sapiens: tồn −1, tạm giữ về 0");
  const khSau = await prisma.khachHang.findUniqueOrThrow({ where: { soDienThoai: "0933333333" } });
  kiemTra(khSau.diemHienTai === khTruoc.diemHienTai - 50 + 27 && khSau.diemTichLuy === khTruoc.diemTichLuy + 27, "điểm KH: −50 +27");
  kiemTra((await prisma.maGiamGia.findUniqueOrThrow({ where: { maCode: "GIAM10" } })).daSuDung === maGGTruoc.daSuDung + 1, "mã GIAM10 +1 lượt");
  kiemTra((await posService.layGioHang(maTK)).don === null, "không còn đơn đang lập");

  console.log("4. Hủy đơn nháp + thăng hạng");
  await posService.themSach(maTK, hoangTuBe.maSach, 2);
  await posService.huyDon(maTK);
  kiemTra((await sach(hoangTuBe.isbn)).soLuongTamGiu === 0, "hủy đơn → giải phóng tạm giữ");
  // Khách Đồng 320 điểm tích lũy, mua 2.000.000đ → +200 điểm → 520 ≥ 500 → lên Bạc
  const sql = await sach("9786042000024"); // Clean Code 280.000, tồn 9
  await posService.chonKhachHang(maTK, "0911111111");
  await posService.themSach(maTK, sql.maSach, 7);
  await posService.thanhToan(maTK, "QUET_THE", null);
  const mai = await prisma.khachHang.findUniqueOrThrow({ where: { soDienThoai: "0911111111" }, include: { hangThanhVien: true } });
  kiemTra(mai.hangThanhVien.tenHang === "Bạc", `thăng hạng: ${mai.diemTichLuy} điểm → ${mai.hangThanhVien.tenHang}`);

  console.log("5. Combo (Mắt biếc 110k + Cho tôi xin một vé 85k = combo 175k)");
  const matBiec = await sach("9786042000001");
  const veTuoiTho = await sach("9786042000002");
  await posService.themSach(maTK, matBiec.maSach, 2);
  await posService.themSach(maTK, veTuoiTho.maSach, 1);
  let gio = await posService.layGioHang(maTK);
  // tạm tính 305.000, đủ 1 bộ (dư 1 Mắt biếc) → giảm 20.000 → 285.000, VAT 5% = 14.250 → 299.250
  kiemTra(gio.tien!.giamCombo === 20000 && gio.tien!.combosApDung[0]?.soBo === 1, "1 bộ combo, giảm 20.000");
  kiemTra(gio.tien!.tongTien === 299250, `tổng ${gio.tien!.tongTien} = 299.250`);
  await posService.themSach(maTK, veTuoiTho.maSach, 1);
  gio = await posService.layGioHang(maTK);
  kiemTra(gio.tien!.giamCombo === 40000 && gio.tien!.combosApDung[0]?.soBo === 2, "2 bộ combo, giảm 40.000");
  const maHDCombo = await posService.thanhToan(maTK, "MA_QR", null);
  const hdCombo = await prisma.hoaDon.findUniqueOrThrow({ where: { maHD: maHDCombo } });
  kiemTra(Number(hdCombo.giamCombo) === 40000 && Number(hdCombo.giamHangThe) === 0, "HĐ lưu giamCombo = 40.000");

  console.log("6. Hủy đơn nháp: bằng tay / quá hạn / đăng xuất");
  const doraemon = await sach("9786042000016");
  const donCuoi = () => prisma.hoaDon.findFirstOrThrow({ where: { maTK }, orderBy: { maHD: "desc" } });
  await posService.themSach(maTK, doraemon.maSach, 3);
  await posService.huyDon(maTK);
  let d = await donCuoi();
  kiemTra(d.trangThai === "DA_HUY" && d.lyDoHuy === LY_DO_HUY.NHAN_VIEN && (await sach(doraemon.isbn)).soLuongTamGiu === 0, "bấm Hủy → DA_HUY, trả kho");

  await posService.themSach(maTK, doraemon.maSach, 3);
  const maQuaHan = (await donCuoi()).maHD;
  await posService.themSach(3, doraemon.maSach, 2); // đơn của nhân viên khác (Hào)
  // Giả lập cả 2 đơn bị bỏ quên quá 30 phút
  await prisma.$executeRaw`UPDATE HoaDon SET thoiGianCapNhat = DATEADD(MINUTE, -31, SYSDATETIME()) WHERE trangThai = N'DANG_LAP'`;
  kiemTra((await sach(doraemon.isbn)).soLuongTamGiu === 5, "trước dọn dẹp: tạm giữ 5");
  await phaiLoi(() => posService.themSach(maTK, doraemon.maSach), "đã tự hủy");
  d = await prisma.hoaDon.findUniqueOrThrow({ where: { maHD: maQuaHan } });
  kiemTra(d.trangThai === "DA_HUY" && d.lyDoHuy === LY_DO_HUY.QUA_HAN, "đơn quá hạn → DA_HUY, lý do tự động");
  kiemTra((await sach(doraemon.isbn)).soLuongTamGiu === 0, "dọn cả đơn quá hạn của nhân viên khác → tạm giữ 0");
  kiemTra((await prisma.hoaDon.count({ where: { trangThai: "DANG_LAP" } })) === 0, "không còn đơn nháp nào");
  const gioHao = await posService.layGioHang(3);
  kiemTra(gioHao.don === null && !!gioHao.thongBao?.includes("đã tự hủy"), `Hào được báo: ${gioHao.thongBao}`);
  await phaiLoi(() => posService.boKhachHang(3), "đã tự hủy");

  await posService.themSach(maTK, doraemon.maSach, 1);
  const conMoi = await posService.layGioHang(maTK);
  kiemTra(conMoi.don !== null && conMoi.don.trangThai === "DANG_LAP" && conMoi.hetHanLuc! > new Date(), "đơn mới chưa quá hạn vẫn được giữ (thông báo đơn cũ vẫn hiện 10 phút)");
  kiemTra((await posService.soSachDonDangLap(maTK)) === 1, "có 1 đầu sách → đăng xuất sẽ cảnh báo");
  await posService.huyDonKhiDangXuat(maTK);
  d = await donCuoi();
  kiemTra(d.trangThai === "DA_HUY" && d.lyDoHuy === LY_DO_HUY.DANG_XUAT && (await sach(doraemon.isbn)).soLuongTamGiu === 0, "đăng xuất → DA_HUY, trả kho");
  await posService.huyDonKhiDangXuat(maTK); // không có đơn → không lỗi

  console.log(loi ? `\n✘ ${loi} kiểm tra thất bại` : "\n✔ Tất cả kiểm tra đạt");
  process.exitCode = loi ? 1 : 0;
}
main().finally(() => prisma.$disconnect());
