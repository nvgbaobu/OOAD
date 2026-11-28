// Truy vấn tổng hợp cho báo cáo doanh thu / Dashboard / xuất Excel.
// Cộng dồn hàng trăm hóa đơn → đọc thẳng các cột cần thiết bằng SQL (không dựng từng đối tượng HoaDon).
import { prisma } from "@/lib/prisma";

export const baoCaoRepository = {
  /** Hóa đơn đã thanh toán trong [tu, den) kèm nhân viên và chi tiết (sách, thể loại). */
  hoaDonDaThanhToan: (tu: Date, den: Date) =>
    prisma.hoaDon.findMany({
      where: { trangThai: "DA_THANH_TOAN", thoiGianTao: { gte: tu, lt: den } },
      select: {
        maHD: true, thoiGianTao: true, maKH: true, phuongThucTT: true, tamTinh: true, giamCombo: true, giamHangThe: true,
        giamMaGiamGia: true, giamDiem: true, thueVAT: true, tongTien: true,
        taiKhoan: { select: { maTK: true, hoTen: true } },
        chiTiets: { select: { soLuong: true, thanhTien: true, sach: { select: { maSach: true, tenSach: true, theLoai: { select: { tenTL: true } } } } } },
      },
      orderBy: { thoiGianTao: "asc" },
    }),

  /** Số lượng + tổng tiền hóa đơn đã thanh toán rồi bị hủy trong [tu, den). */
  hoaDonDaHuy: (tu: Date, den: Date) =>
    prisma.hoaDon.aggregate({
      where: { trangThai: "DA_HUY", phuongThucTT: { not: null }, thoiGianTao: { gte: tu, lt: den } }, _count: true, _sum: { tongTien: true },
    }),

  /** Danh sách hóa đơn (gồm cả đã hủy sau thanh toán) để xuất sheet "Hóa đơn". */
  hoaDonDeXuat: (tu: Date, den: Date) =>
    prisma.hoaDon.findMany({
      where: { phuongThucTT: { not: null }, trangThai: { in: ["DA_THANH_TOAN", "DA_HUY"] }, thoiGianTao: { gte: tu, lt: den } },
      select: {
        maHD: true, thoiGianTao: true, trangThai: true, phuongThucTT: true, tamTinh: true, giamCombo: true, giamHangThe: true,
        giamMaGiamGia: true, giamDiem: true, thueVAT: true, tongTien: true, lyDoHuy: true,
        taiKhoan: { select: { hoTen: true } }, khachHang: { select: { hoTen: true, soDienThoai: true } },
      },
      orderBy: { thoiGianTao: "asc" },
    }),

  /** Hóa đơn gần đây (Dashboard). */
  hoaDonGanDay: (lay = 6) =>
    prisma.hoaDon.findMany({
      where: { trangThai: { in: ["DA_THANH_TOAN", "DA_HUY"] }, phuongThucTT: { not: null } },
      select: { maHD: true, thoiGianTao: true, tongTien: true, trangThai: true, taiKhoan: { select: { hoTen: true } }, khachHang: { select: { hoTen: true } } },
      orderBy: { thoiGianTao: "desc" }, take: lay,
    }),

  /** Số sách đang bán có tồn ≤ định mức. */
  demSachSapHet: () => prisma.sach.count({ where: { trangThai: "DANG_BAN", soLuongTon: { lte: prisma.sach.fields.dinhMucToiThieu } } }),
  /** Số đơn đang lập ở POS. */
  demDonDangLap: () => prisma.hoaDon.count({ where: { trangThai: "DANG_LAP" } }),
};
