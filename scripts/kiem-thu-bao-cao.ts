// Kiểm thử Dashboard + báo cáo doanh thu + xuất Excel trên DB thật. Chạy: npm run test:bao-cao (chạy xong tự seed lại)
import "dotenv/config";
import ExcelJS from "exceljs";
import { prisma } from "../lib/prisma";
import { baoCaoService, docKhoangNgay, khoangNgay } from "../lib/services/baoCaoService";
import { taoFileExcelBaoCao } from "../lib/services/xuatExcelBaoCao";
import { posService } from "../lib/services/posService";
import { hoaDonService } from "../lib/services/hoaDonService";
import { ngayInput } from "../lib/dinhDang";

let loi = 0;
const kiemTra = (dk: boolean, moTa: string) => { console.log(dk ? "  ✔" : "  ✘", moTa); if (!dk) loi++; };

async function main() {
  const admin = 1, staff = 2;
  const k30 = khoangNgay("30Ngay");

  console.log("1. Số liệu báo cáo khớp dữ liệu gốc");
  const bc = await baoCaoService.baoCao(k30);
  const goc = await prisma.hoaDon.aggregate({ where: { trangThai: "DA_THANH_TOAN", thoiGianTao: { gte: k30.tu, lt: k30.den } }, _sum: { tongTien: true }, _count: true });
  kiemTra(bc.tong.doanhThu === Number(goc._sum.tongTien) && bc.tong.soHoaDon === goc._count, `doanh thu 30 ngày = ${bc.tong.doanhThu} (${bc.tong.soHoaDon} HĐ)`);
  kiemTra(bc.tong.tamTinh - bc.tong.tongGiam + bc.tong.thueVAT === bc.tong.doanhThu, "tạm tính − giảm + VAT = doanh thu");
  kiemTra(bc.theoNgay.length === 30 && bc.theoNgay.reduce((t, x) => t + x.doanhThu, 0) === bc.tong.doanhThu, "30 dòng theo ngày, cộng lại = tổng");
  kiemTra(bc.theoNhanVien.reduce((t, x) => t + x.doanhThu, 0) === bc.tong.doanhThu && bc.theoPhuongThuc.reduce((t, x) => t + x.soHoaDon, 0) === bc.tong.soHoaDon,
    "theo nhân viên / phương thức cộng lại = tổng");
  kiemTra(bc.theoTheLoai.reduce((t, x) => t + x.tienHang, 0) === bc.tong.tamTinh && bc.theoTheLoai.reduce((t, x) => t + x.soCuon, 0) === bc.tong.soCuon,
    "theo thể loại: tiền hàng = tạm tính, số cuốn = tổng");
  kiemTra(bc.topSach.every((s, i) => i === 0 || bc.topSach[i - 1].soCuon >= s.soCuon), "top sách sắp theo số cuốn giảm dần");

  console.log("2. Thanh toán / hủy cập nhật báo cáo");
  const truoc = (await baoCaoService.dashboard()).homNay;
  const dacNhanTam = await prisma.sach.findUniqueOrThrow({ where: { isbn: "9786042000013" } });
  await posService.themSach(staff, dacNhanTam.maSach, 2);
  const maHD = await posService.thanhToan(staff, "MA_QR", null);
  const hd = await prisma.hoaDon.findUniqueOrThrow({ where: { maHD } });
  const sau = (await baoCaoService.dashboard()).homNay;
  kiemTra(sau.doanhThu === truoc.doanhThu + Number(hd.tongTien) && sau.soHoaDon === truoc.soHoaDon + 1 && sau.soCuon === truoc.soCuon + 2,
    `hôm nay +${Number(hd.tongTien)}đ, +1 HĐ, +2 cuốn`);
  await hoaDonService.huy(maHD, "Kiểm thử báo cáo", admin);
  const sauHuy = (await baoCaoService.dashboard()).homNay;
  kiemTra(sauHuy.doanhThu === truoc.doanhThu && sauHuy.soHoaDonHuy === truoc.soHoaDonHuy + 1 && sauHuy.giaTriHuy === Number(hd.tongTien),
    "hủy → doanh thu về như cũ, ghi nhận 1 HĐ hủy");

  console.log("3. Dashboard");
  const d = await baoCaoService.dashboard();
  kiemTra(d.bayNgay.length === 7 && d.bayNgay[6].ngay === ngayInput(new Date()), "biểu đồ 7 ngày, ngày cuối là hôm nay");
  kiemTra(d.canXuLy.phieuNhap === 1 && d.canXuLy.kiemKe === 1 && d.canXuLy.xuatHuy === 1 && d.canXuLy.sapHet >= 1, `cần xử lý: ${JSON.stringify(d.canXuLy)}`);
  kiemTra(d.topSach.length <= 5 && d.hoaDonGanDay[0]?.maHD === maHD, "top 5 sách; hóa đơn gần nhất là HĐ vừa tạo (kể cả đã hủy)");

  console.log("4. Đọc khoảng ngày");
  const dao = docKhoangNgay("2026-11-10", "2026-11-01");
  kiemTra(dao.tuNgay === "2026-11-01" && dao.denNgay === "2026-11-10" && ngayInput(dao.den) === "2026-11-11", "ngày đảo ngược → đổi chỗ, đến hết ngày cuối");
  const dai = docKhoangNgay("2025-01-01", "2026-12-31");
  kiemTra(!!dai.canhBao && dai.denNgay === "2026-01-01", `quá 366 ngày → cắt: ${dai.canhBao}`);
  kiemTra(docKhoangNgay("abc", "").tuNgay === ngayInput(khoangNgay("thangNay").tu), "sai định dạng → tháng này");

  console.log("5. Xuất Excel");
  const buf = await taoFileExcelBaoCao(k30, "Kiểm thử");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as unknown as ArrayBuffer);
  const ten = wb.worksheets.map((w) => w.name);
  kiemTra(ten.join("|") === "Tổng hợp|Theo ngày|Theo thể loại|Sách bán chạy|Theo nhân viên|Theo phương thức|Hóa đơn", `7 sheet: ${ten.join(", ")}`);
  const tongHop = wb.getWorksheet("Tổng hợp")!;
  let dt: unknown;
  tongHop.eachRow((r) => { if (r.getCell(1).value === "DOANH THU") dt = r.getCell(2).value; });
  kiemTra(dt === bc.tong.doanhThu, `ô DOANH THU = ${dt}`);
  const wsHD = wb.getWorksheet("Hóa đơn")!;
  kiemTra(wsHD.rowCount - 1 === bc.tong.soHoaDon + bc.tong.soHoaDonHuy + 1, `sheet Hóa đơn: ${wsHD.rowCount - 1} dòng (gồm HĐ đã hủy)`);
  const o = wsHD.getRow(wsHD.rowCount).getCell(2).value as Date;
  kiemTra(o instanceof Date && o.getUTCHours() === hd.thoiGianTao.getHours(), "giờ trong Excel = giờ cửa hàng (đã bù múi giờ)");

  console.log(loi ? `\n✘ ${loi} kiểm tra thất bại` : "\n✔ Tất cả kiểm tra đạt");
  process.exitCode = loi ? 1 : 0;
}
main().finally(() => prisma.$disconnect());
