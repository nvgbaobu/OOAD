// UC9.3 – Xuất báo cáo doanh thu ra file PDF (pdfkit). Font DejaVu Sans nhúng trong lib/fonts (hỗ trợ tiếng Việt,
// không cần Internet). Nội dung giống các sheet tổng hợp của file Excel; danh sách từng hóa đơn chỉ có ở bản Excel.
import path from "node:path";
import PDFDocument from "pdfkit";
import { baoCaoService, type KhoangNgay } from "@/lib/services/baoCaoService";
import { TEN_PHUONG_THUC, type PhuongThucTT } from "@/lib/services/posService";
import { cauHinhRepository } from "@/lib/repositories/cauHinhRepository";
import { ngay } from "@/lib/dinhDang";

const FONT = path.join(process.cwd(), "lib/fonts/DejaVuSans.ttf");
const FONT_DAM = path.join(process.cwd(), "lib/fonts/DejaVuSans-Bold.ttf");
const so = (n: number) => n.toLocaleString("vi-VN");
const tien = (n: number) => `${so(n)}đ`;

type Cot = { tieuDe: string; rong: number; phai?: boolean };

/** Vẽ một bảng đơn giản; tự sang trang khi hết chỗ (lặp lại dòng tiêu đề). */
function veBang(doc: PDFKit.PDFDocument, tieuDe: string, cot: Cot[], dong: string[][], dongTong?: string[]) {
  const trai = doc.page.margins.left;
  const cao = 18;
  const day = () => doc.page.height - doc.page.margins.bottom;
  const veDong = (o: string[], dam: boolean, nen?: string) => {
    if (doc.y + cao > day()) doc.addPage();
    const y = doc.y;
    if (nen) doc.rect(trai, y, cot.reduce((t, c) => t + c.rong, 0), cao).fill(nen).fillColor("black");
    let x = trai;
    doc.font(dam ? FONT_DAM : FONT).fontSize(9);
    cot.forEach((c, i) => {
      doc.text(o[i] ?? "", x + 4, y + 4, { width: c.rong - 8, align: c.phai ? "right" : "left", lineBreak: false, ellipsis: true });
      x += c.rong;
    });
    doc.moveTo(trai, y + cao).lineTo(x, y + cao).lineWidth(0.5).strokeColor("#d1d5db").stroke();
    doc.y = y + cao;
  };
  if (doc.y + cao * 3 > day()) doc.addPage();
  doc.moveDown(0.6).font(FONT_DAM).fontSize(11).fillColor("black").text(tieuDe, trai, doc.y);
  doc.moveDown(0.3);
  veDong(cot.map((c) => c.tieuDe), true, "#e5e7eb");
  if (dong.length === 0) veDong(["Không có dữ liệu"], false);
  dong.forEach((d) => veDong(d, false));
  if (dongTong) veDong(dongTong, true, "#f3f4f6");
}

export async function taoFilePdfBaoCao(k: KhoangNgay, nguoiXuat: string): Promise<Buffer> {
  const [bc, ch] = await Promise.all([baoCaoService.baoCao(k, 20), cauHinhRepository.lay()]);
  const t = bc.tong;
  const cuoi = new Date(k.den.getTime() - 1);
  const doc = new PDFDocument({ size: "A4", margin: 40, info: { Title: `Báo cáo doanh thu ${ngay(k.tu)} – ${ngay(cuoi)}`, Author: nguoiXuat } });
  const xong = new Promise<Buffer>((ok, loi) => {
    const phan: Buffer[] = [];
    doc.on("data", (c: Buffer) => phan.push(c));
    doc.on("end", () => ok(Buffer.concat(phan)));
    doc.on("error", loi);
  });

  doc.font(FONT_DAM).fontSize(14).text(ch.tenCuaHang, { align: "center" });
  doc.font(FONT).fontSize(9).text([ch.diaChi, ch.soDienThoai && `ĐT ${ch.soDienThoai}`].filter(Boolean).join(" · "), { align: "center" });
  doc.moveDown(0.6).font(FONT_DAM).fontSize(13).text("BÁO CÁO DOANH THU", { align: "center" });
  doc.font(FONT).fontSize(10).text(`Từ ngày ${ngay(k.tu)} đến ngày ${ngay(cuoi)}`, { align: "center" });
  doc.fontSize(8).fillColor("#4b5563")
    .text(`Người xuất: ${nguoiXuat} – lúc ${new Date().toLocaleString("vi-VN")}. Doanh thu chỉ tính hóa đơn đã thanh toán.`, { align: "center" })
    .fillColor("black");

  veBang(doc, "1. Tổng hợp", [{ tieuDe: "Chỉ tiêu", rong: 300 }, { tieuDe: "Giá trị", rong: 160, phai: true }], [
    ["Số hóa đơn đã thanh toán", so(t.soHoaDon)], ["Số cuốn đã bán", so(t.soCuon)], ["Số khách thành viên mua hàng", so(t.soKhachThanhVien)],
    ["Tạm tính (giá lẻ)", tien(t.tamTinh)], ["Giảm combo", tien(t.giamCombo)], ["Ưu đãi hạng thẻ", tien(t.giamHangThe)],
    ["Mã giảm giá", tien(t.giamMaGiamGia)], ["Đổi điểm", tien(t.giamDiem)], ["Doanh thu trước thuế", tien(t.doanhThuTruocThue)],
    ["Thuế GTGT", tien(t.thueVAT)], ["Giá trị trung bình / hóa đơn", tien(t.giaTriTB)],
    ["Hóa đơn đã hủy (không tính doanh thu)", `${so(t.soHoaDonHuy)} HĐ – ${tien(t.giaTriHuy)}`],
  ], ["DOANH THU", tien(t.doanhThu)]);

  veBang(doc, "2. Doanh thu theo ngày", [{ tieuDe: "Ngày", rong: 140 }, { tieuDe: "Số hóa đơn", rong: 100, phai: true }, { tieuDe: "Số cuốn", rong: 100, phai: true }, { tieuDe: "Doanh thu", rong: 175, phai: true }],
    bc.theoNgay.map((x) => [ngay(new Date(`${x.ngay}T00:00:00`)), so(x.soHoaDon), so(x.soCuon), tien(x.doanhThu)]),
    ["Tổng", so(t.soHoaDon), so(t.soCuon), tien(t.doanhThu)]);

  veBang(doc, "3. Theo thể loại (tiền hàng trước giảm giá)", [{ tieuDe: "Thể loại", rong: 260 }, { tieuDe: "Số cuốn", rong: 100, phai: true }, { tieuDe: "Tiền hàng", rong: 155, phai: true }],
    bc.theoTheLoai.map((x) => [x.tenTL, so(x.soCuon), tien(x.tienHang)]));

  veBang(doc, "4. Sách bán chạy", [{ tieuDe: "#", rong: 30, phai: true }, { tieuDe: "Sách", rong: 235 }, { tieuDe: "Thể loại", rong: 120 }, { tieuDe: "Số cuốn", rong: 55, phai: true }, { tieuDe: "Tiền hàng", rong: 75, phai: true }],
    bc.topSach.map((x, i) => [String(i + 1), x.tenSach, x.tenTL, so(x.soCuon), so(x.tienHang)]));

  veBang(doc, "5. Theo nhân viên", [{ tieuDe: "Nhân viên", rong: 260 }, { tieuDe: "Số hóa đơn", rong: 100, phai: true }, { tieuDe: "Doanh thu", rong: 155, phai: true }],
    bc.theoNhanVien.map((x) => [x.hoTen, so(x.soHoaDon), tien(x.doanhThu)]));

  veBang(doc, "6. Theo phương thức thanh toán", [{ tieuDe: "Phương thức", rong: 260 }, { tieuDe: "Số hóa đơn", rong: 100, phai: true }, { tieuDe: "Doanh thu", rong: 155, phai: true }],
    bc.theoPhuongThuc.map((x) => [TEN_PHUONG_THUC[x.pt as PhuongThucTT] ?? x.pt, so(x.soHoaDon), tien(x.doanhThu)]));

  doc.end();
  return xong;
}
