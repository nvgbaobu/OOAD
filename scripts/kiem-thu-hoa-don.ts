// Kiểm thử nghiệp vụ Hóa đơn (tra cứu, hủy hóa đơn đã thanh toán) trên DB thật. Chạy: npm run test:hoa-don (chạy xong tự seed lại)
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { LoiNghiepVu } from "../lib/loi";
import { posService } from "../lib/services/posService";
import { hoaDonService } from "../lib/services/hoaDonService";
import { tinhDiemCong } from "../lib/services/tinhTienHoaDon";

let loi = 0;
const kiemTra = (dk: boolean, moTa: string) => { console.log(dk ? "  ✔" : "  ✘", moTa); if (!dk) loi++; };
async function phaiLoi(fn: () => Promise<unknown>, chua: string) {
  try { await fn(); kiemTra(false, `phải báo lỗi "${chua}"`); }
  catch (e) { kiemTra(e instanceof LoiNghiepVu && e.message.includes(chua), `báo lỗi: ${e instanceof Error ? e.message : e}`); }
}
const kh = (sdt: string) => prisma.khachHang.findUniqueOrThrow({ where: { soDienThoai: sdt }, include: { hangThanhVien: true } });
const sach = (isbn: string) => prisma.sach.findUniqueOrThrow({ where: { isbn } });
const ma = (code: string) => prisma.maGiamGia.findUniqueOrThrow({ where: { maCode: code } });

async function main() {
  const admin = { maTK: 1, vaiTro: "ADMIN" }, an = { maTK: 2, vaiTro: "STAFF" }, hao = { maTK: 3, vaiTro: "STAFF" };

  console.log("1. Thanh toán hóa đơn có khách + mã + điểm (khách lên hạng)");
  const rungNaUy = await sach("9786042000007"); // tồn 15, 145.000đ
  const mai0 = await kh("0911111111"); // Đồng, 120 điểm, tích lũy 320
  const giam10 = await ma("GIAM10");
  await posService.themSach(an.maTK, rungNaUy.maSach, 15);
  await posService.chonKhachHang(an.maTK, mai0.soDienThoai);
  await posService.apMaGiamGia(an.maTK, "giam10");
  await posService.datDiemSuDung(an.maTK, 50);
  const maHD = await posService.thanhToan(an.maTK, "QUET_THE", null);
  const hd = (await prisma.hoaDon.findUniqueOrThrow({ where: { maHD } }));
  const mai1 = await kh(mai0.soDienThoai);
  const diemCong1 = tinhDiemCong(Number(hd.tongTien), 10000);
  kiemTra(mai1.diemHienTai === 120 - 50 + diemCong1 && mai1.diemTichLuy === 320 + diemCong1, `điểm: 120 − 50 + ${diemCong1} = ${mai1.diemHienTai}`);
  kiemTra(mai1.hangThanhVien.tenHang === "Bạc", `lên hạng ${mai0.hangThanhVien.tenHang} → ${mai1.hangThanhVien.tenHang}`);
  kiemTra((await sach(rungNaUy.isbn)).soLuongTon === 0 && (await ma("GIAM10")).daSuDung === giam10.daSuDung + 1, "trừ kho 15, mã +1 lượt");

  console.log("2. Quyền xem / tra cứu");
  kiemTra(!!(await hoaDonService.xem(maHD, an)) && !(await hoaDonService.xem(maHD, hao)) && !!(await hoaDonService.xem(maHD, admin)),
    "Staff lập xem được, Staff khác không, Admin xem được");
  const dsHao = await hoaDonService.danhSach({}, 1, hao);
  kiemTra(dsHao.hoaDons.every((h) => h.maTK === hao.maTK), `Staff Hào chỉ thấy hóa đơn của mình (${dsHao.soHoaDon})`);
  const theoSdt = await hoaDonService.danhSach({ tuKhoa: "0911111111" }, 1, admin);
  kiemTra(theoSdt.hoaDons.some((h) => h.maHD === maHD) && theoSdt.hoaDons.every((h) => h.khachHang?.soDienThoai === "0911111111"), "tìm theo SĐT khách");
  kiemTra((await hoaDonService.danhSach({ tuKhoa: `#${maHD}` }, 1, admin)).hoaDons[0]?.maHD === maHD, "tìm theo số HĐ (#123)");
  const homNay = new Date(); homNay.setHours(0, 0, 0, 0);
  const trongNgay = await hoaDonService.danhSach({ tuNgay: homNay }, 1, admin);
  kiemTra(trongNgay.hoaDons.every((h) => h.thoiGianTao >= homNay) && trongNgay.hoaDons.some((h) => h.maHD === maHD), `lọc từ hôm nay: ${trongNgay.soHoaDon} HĐ`);
  const truoc = await hoaDonService.danhSach({}, 1, admin);

  console.log("3. Hủy hóa đơn đã thanh toán");
  await phaiLoi(() => hoaDonService.huy(maHD, "   ", admin.maTK), "lý do");
  await hoaDonService.huy(maHD, " Khách  trả hàng ", admin.maTK);
  const sau = await prisma.hoaDon.findUniqueOrThrow({ where: { maHD } });
  kiemTra(sau.trangThai === "DA_HUY" && sau.lyDoHuy === "Khách trả hàng" && Number(sau.tongTien) === Number(hd.tongTien), "DA_HUY, lưu lý do, giữ nguyên số tiền");
  kiemTra((await sach(rungNaUy.isbn)).soLuongTon === 15, "hoàn kho 15 cuốn");
  const mai2 = await kh(mai0.soDienThoai);
  kiemTra(mai2.diemHienTai === 120 && mai2.diemTichLuy === 320, `điểm về như cũ: ${mai2.diemHienTai}/${mai2.diemTichLuy}`);
  kiemTra(mai2.hangThanhVien.tenHang === "Đồng", "hạ về hạng Đồng (điểm tích lũy 320 < 500)");
  kiemTra((await ma("GIAM10")).daSuDung === giam10.daSuDung, "hoàn lượt mã GIAM10");
  await phaiLoi(() => hoaDonService.huy(maHD, "lần 2", admin.maTK), "đã bị hủy trước đó");
  kiemTra((await sach(rungNaUy.isbn)).soLuongTon === 15, "hủy lần 2 không hoàn kho thêm");
  const sauHuy = await hoaDonService.danhSach({}, 1, admin);
  kiemTra(sauHuy.doanhThu === truoc.doanhThu - Number(hd.tongTien) && sauHuy.soHoaDon === truoc.soHoaDon, "doanh thu bỏ hóa đơn đã hủy, vẫn liệt kê hóa đơn");
  kiemTra((await hoaDonService.danhSach({ trangThai: "DA_HUY" }, 1, admin)).hoaDons.some((h) => h.maHD === maHD), "lọc 'Đã hủy (sau thanh toán)'");
  const nk = await prisma.nhatKyHeThong.findFirstOrThrow({ where: { module: "HOA_DON", hanhDong: "HUY" }, orderBy: { maLog: "desc" } });
  kiemTra(!!nk.noiDung?.includes("hạng Bạc → Đồng") && nk.noiDung.includes("hoàn 1 lượt mã GIAM10"), `nhật ký: ${nk.noiDung}`);

  console.log("4. Khách đã tiêu điểm được cộng → điểm hiện tại về 0");
  const khoa0 = await kh("0944444444"); // 30 điểm
  const dacNhanTam = await sach("9786042000013"); // 88.000đ
  await posService.themSach(hao.maTK, dacNhanTam.maSach, 5);
  await posService.chonKhachHang(hao.maTK, khoa0.soDienThoai);
  const maHD2 = await posService.thanhToan(hao.maTK, "TIEN_MAT", 500000);
  const hd2 = await prisma.hoaDon.findUniqueOrThrow({ where: { maHD: maHD2 } });
  await prisma.khachHang.update({ where: { maKH: khoa0.maKH }, data: { diemHienTai: 10 } }); // giả lập đã đổi bớt điểm ở đơn khác
  await hoaDonService.huy(maHD2, "Nhập sai", admin.maTK);
  const khoa1 = await kh(khoa0.soDienThoai);
  kiemTra(khoa1.diemHienTai === 0 && khoa1.diemTichLuy === 30, `điểm hiện tại 10 − ${tinhDiemCong(Number(hd2.tongTien), 10000)} → 0 (không âm), tích lũy về 30`);
  const nk2 = await prisma.nhatKyHeThong.findFirstOrThrow({ where: { module: "HOA_DON", hanhDong: "HUY" }, orderBy: { maLog: "desc" } });
  kiemTra(!!nk2.noiDung?.includes(`hụt ${tinhDiemCong(Number(hd2.tongTien), 10000) - 10} điểm`), "nhật ký ghi số điểm bị hụt");

  console.log("5. Không hủy được đơn chưa thanh toán");
  await posService.themSach(an.maTK, dacNhanTam.maSach, 1);
  const nhap = await prisma.hoaDon.findFirstOrThrow({ where: { maTK: an.maTK, trangThai: "DANG_LAP" } });
  await phaiLoi(() => hoaDonService.huy(nhap.maHD, "x", admin.maTK), "Chỉ hủy được hóa đơn đã thanh toán");
  kiemTra(!(await hoaDonService.xem(nhap.maHD, admin)), "đơn đang lập không xem được ở màn hình hóa đơn");
  await posService.huyDon(an.maTK);
  const nhapHuy = await hoaDonService.danhSach({ trangThai: "NHAP_HUY" }, 1, admin);
  kiemTra(nhapHuy.hoaDons.some((h) => h.maHD === nhap.maHD) && nhapHuy.hoaDons.every((h) => h.phuongThucTT === null), "lọc 'Đơn nháp đã hủy'");
  kiemTra(!(await hoaDonService.danhSach({}, 1, admin)).hoaDons.some((h) => h.trangThai === "DANG_LAP"), "danh sách không có đơn đang lập");

  console.log(loi ? `\n✘ ${loi} kiểm tra thất bại` : "\n✔ Tất cả kiểm tra đạt");
  process.exitCode = loi ? 1 : 0;
}
main().finally(() => prisma.$disconnect());
