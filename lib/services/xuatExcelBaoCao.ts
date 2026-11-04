// Xuất báo cáo doanh thu ra file .xlsx (exceljs). Mỗi phần báo cáo 1 sheet + sheet danh sách hóa đơn.
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { baoCaoService, type KhoangNgay } from "@/lib/services/baoCaoService";
import { TEN_PHUONG_THUC, type PhuongThucTT } from "@/lib/services/posService";
import { cauHinhRepository } from "@/lib/repositories/cauHinhRepository";
import { ngay } from "@/lib/dinhDang";

const TIEN = "#,##0";
/** exceljs ghi Date theo UTC → bù múi giờ để Excel hiện đúng giờ cửa hàng. */
const gioDiaPhuong = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000);

type Cot = { header: string; key: string; width: number; tien?: boolean; numFmt?: string };

function themSheet(wb: ExcelJS.Workbook, ten: string, cot: Cot[], dong: Record<string, unknown>[], dongTong?: Record<string, unknown>) {
  const ws = wb.addWorksheet(ten, { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = cot.map((c) => ({ header: c.header, key: c.key, width: c.width }));
  cot.forEach((c, i) => { if (c.tien || c.numFmt) ws.getColumn(i + 1).numFmt = c.numFmt ?? TIEN; });
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };
  ws.addRows(dong);
  if (dongTong) ws.addRow(dongTong).font = { bold: true };
  return ws;
}

export async function taoFileExcelBaoCao(k: KhoangNgay, nguoiXuat: string) {
  const [bc, ch, hoaDons] = await Promise.all([
    baoCaoService.baoCao(k, 50),
    cauHinhRepository.lay(),
    prisma.hoaDon.findMany({
      where: { phuongThucTT: { not: null }, trangThai: { in: ["DA_THANH_TOAN", "DA_HUY"] }, thoiGianTao: { gte: k.tu, lt: k.den } },
      select: {
        maHD: true, thoiGianTao: true, trangThai: true, phuongThucTT: true, tamTinh: true, giamCombo: true, giamHangThe: true,
        giamMaGiamGia: true, giamDiem: true, thueVAT: true, tongTien: true, lyDoHuy: true,
        taiKhoan: { select: { hoTen: true } }, khachHang: { select: { hoTen: true, soDienThoai: true } },
      },
      orderBy: { thoiGianTao: "asc" },
    }),
  ]);
  const t = bc.tong;
  const cuoi = new Date(k.den.getTime() - 1);

  const wb = new ExcelJS.Workbook();
  wb.creator = nguoiXuat;
  wb.created = new Date();

  // 1. Tổng hợp
  const ws = wb.addWorksheet("Tổng hợp");
  ws.columns = [{ width: 34 }, { width: 20 }];
  ws.addRow([ch.tenCuaHang]).font = { bold: true, size: 14 };
  ws.addRow([`BÁO CÁO DOANH THU ${ngay(k.tu)} – ${ngay(cuoi)}`]).font = { bold: true, size: 12 };
  ws.addRow([`Người xuất: ${nguoiXuat} – lúc ${new Date().toLocaleString("vi-VN")}`]);
  ws.addRow(["Doanh thu chỉ tính hóa đơn đã thanh toán (không tính hóa đơn đã hủy)."]).font = { italic: true };
  ws.addRow([]);
  const tongHop: [string, number, boolean?][] = [
    ["Số hóa đơn đã thanh toán", t.soHoaDon], ["Số cuốn đã bán", t.soCuon], ["Số khách thành viên mua hàng", t.soKhachThanhVien],
    ["Tạm tính (giá lẻ)", t.tamTinh, true], ["Giảm combo", t.giamCombo, true], ["Ưu đãi hạng thẻ", t.giamHangThe, true],
    ["Mã giảm giá", t.giamMaGiamGia, true], ["Đổi điểm", t.giamDiem, true], ["Tổng giảm", t.tongGiam, true],
    ["Doanh thu trước thuế", t.doanhThuTruocThue, true], ["Thuế GTGT", t.thueVAT, true], ["DOANH THU", t.doanhThu, true],
    ["Giá trị trung bình / hóa đơn", t.giaTriTB, true], ["Số hóa đơn đã hủy", t.soHoaDonHuy], ["Giá trị hóa đơn đã hủy", t.giaTriHuy, true],
  ];
  for (const [nhan, so, tien] of tongHop) {
    const r = ws.addRow([nhan, so]);
    if (tien) r.getCell(2).numFmt = TIEN;
    if (nhan === "DOANH THU") r.font = { bold: true };
  }

  // 2–6. Các bảng chi tiết
  themSheet(wb, "Theo ngày", [
    { header: "Ngày", key: "ngay", width: 14, numFmt: "dd/mm/yyyy" }, { header: "Số hóa đơn", key: "soHoaDon", width: 12 },
    { header: "Số cuốn", key: "soCuon", width: 10 }, { header: "Doanh thu", key: "doanhThu", width: 16, tien: true },
  ], bc.theoNgay.map((x) => ({ ...x, ngay: gioDiaPhuong(new Date(`${x.ngay}T00:00:00`)) })),
  { ngay: "Tổng", soHoaDon: t.soHoaDon, soCuon: t.soCuon, doanhThu: t.doanhThu });

  themSheet(wb, "Theo thể loại", [
    { header: "Thể loại", key: "tenTL", width: 30 }, { header: "Số cuốn", key: "soCuon", width: 10 },
    { header: "Tiền hàng (trước giảm giá)", key: "tienHang", width: 24, tien: true },
  ], bc.theoTheLoai);

  themSheet(wb, "Sách bán chạy", [
    { header: "Sách", key: "tenSach", width: 40 }, { header: "Thể loại", key: "tenTL", width: 24 },
    { header: "Số cuốn", key: "soCuon", width: 10 }, { header: "Tiền hàng", key: "tienHang", width: 16, tien: true },
  ], bc.topSach);

  themSheet(wb, "Theo nhân viên", [
    { header: "Nhân viên", key: "hoTen", width: 26 }, { header: "Số hóa đơn", key: "soHoaDon", width: 12 },
    { header: "Doanh thu", key: "doanhThu", width: 16, tien: true },
  ], bc.theoNhanVien);

  themSheet(wb, "Theo phương thức", [
    { header: "Phương thức", key: "pt", width: 18 }, { header: "Số hóa đơn", key: "soHoaDon", width: 12 },
    { header: "Doanh thu", key: "doanhThu", width: 16, tien: true },
  ], bc.theoPhuongThuc.map((x) => ({ ...x, pt: TEN_PHUONG_THUC[x.pt as PhuongThucTT] ?? x.pt })));

  // 7. Danh sách hóa đơn (kể cả đã hủy, để đối chiếu)
  themSheet(wb, "Hóa đơn", [
    { header: "Số HĐ", key: "maHD", width: 8 }, { header: "Thời gian", key: "thoiGian", width: 18, numFmt: "dd/mm/yyyy hh:mm" },
    { header: "Trạng thái", key: "trangThai", width: 14 }, { header: "Thu ngân", key: "thuNgan", width: 20 },
    { header: "Khách hàng", key: "khach", width: 26 }, { header: "Phương thức", key: "pt", width: 12 },
    { header: "Tạm tính", key: "tamTinh", width: 13, tien: true }, { header: "Giảm combo", key: "giamCombo", width: 12, tien: true },
    { header: "Ưu đãi hạng", key: "giamHangThe", width: 12, tien: true }, { header: "Mã giảm giá", key: "giamMaGiamGia", width: 12, tien: true },
    { header: "Đổi điểm", key: "giamDiem", width: 11, tien: true }, { header: "VAT", key: "thueVAT", width: 11, tien: true },
    { header: "Tổng tiền", key: "tongTien", width: 14, tien: true }, { header: "Lý do hủy", key: "lyDoHuy", width: 30 },
  ], hoaDons.map((h) => ({
    maHD: h.maHD, thoiGian: gioDiaPhuong(h.thoiGianTao), trangThai: h.trangThai === "DA_HUY" ? "Đã hủy" : "Đã thanh toán",
    thuNgan: h.taiKhoan.hoTen, khach: h.khachHang ? `${h.khachHang.hoTen} (${h.khachHang.soDienThoai})` : "Khách lẻ",
    pt: TEN_PHUONG_THUC[h.phuongThucTT as PhuongThucTT] ?? h.phuongThucTT,
    tamTinh: Number(h.tamTinh), giamCombo: Number(h.giamCombo), giamHangThe: Number(h.giamHangThe), giamMaGiamGia: Number(h.giamMaGiamGia),
    giamDiem: Number(h.giamDiem), thueVAT: Number(h.thueVAT), tongTien: Number(h.tongTien), lyDoHuy: h.lyDoHuy ?? "",
  })));

  return Buffer.from(await wb.xlsx.writeBuffer());
}
