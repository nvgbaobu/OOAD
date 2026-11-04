// Báo cáo doanh thu (chỉ Admin). Quy ước:
// - Doanh thu = Σ tongTien của hóa đơn DA_THANH_TOAN (đã gồm VAT, sau mọi giảm giá); hóa đơn đã hủy KHÔNG tính.
// - Ngày của hóa đơn = thoiGianTao (thời điểm thanh toán), theo giờ máy chủ (= giờ cửa hàng). Gom nhóm làm ở Node
//   (SQL Server lưu UTC) – lượng hóa đơn của 1 cửa hàng nhỏ, đọc cả khoảng ngày là đủ nhanh.
// - Theo thể loại / theo sách dùng thành tiền từng dòng (giá bán lẻ × SL, TRƯỚC giảm giá cấp hóa đơn).
import { prisma } from "@/lib/prisma";
import { docNgayInput, ngayInput } from "@/lib/dinhDang";

export type KhoangNgay = { tu: Date; den: Date }; // den: loại trừ (0 giờ ngày sau ngày cuối)

const dauNgay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const congNgay = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Các khoảng ngày hay dùng (tính theo thời điểm `luc`). */
export function khoangNgay(loai: "homNay" | "homQua" | "7Ngay" | "30Ngay" | "thangNay" | "thangTruoc", luc = new Date()): KhoangNgay {
  const homNay = dauNgay(luc);
  switch (loai) {
    case "homNay": return { tu: homNay, den: congNgay(homNay, 1) };
    case "homQua": return { tu: congNgay(homNay, -1), den: homNay };
    case "7Ngay": return { tu: congNgay(homNay, -6), den: congNgay(homNay, 1) };
    case "30Ngay": return { tu: congNgay(homNay, -29), den: congNgay(homNay, 1) };
    case "thangNay": return { tu: new Date(luc.getFullYear(), luc.getMonth(), 1), den: congNgay(homNay, 1) };
    case "thangTruoc": return { tu: new Date(luc.getFullYear(), luc.getMonth() - 1, 1), den: new Date(luc.getFullYear(), luc.getMonth(), 1) };
  }
}

export const SO_NGAY_TOI_DA = 366;

/**
 * Đọc khoảng ngày từ query (?tuNgay=YYYY-MM-DD&denNgay=YYYY-MM-DD, đến hết ngày denNgay).
 * Thiếu/sai → tháng này. Ngày cuối trước ngày đầu thì đổi chỗ; quá 366 ngày thì cắt còn 366 ngày tính từ ngày đầu.
 */
export function docKhoangNgay(tuNgay?: string, denNgay?: string): KhoangNgay & { tuNgay: string; denNgay: string; canhBao?: string } {
  const macDinh = khoangNgay("thangNay");
  let tu = docNgayInput(tuNgay ?? "") ?? macDinh.tu;
  let cuoi = docNgayInput(denNgay ?? "") ?? congNgay(macDinh.den, -1);
  let canhBao: string | undefined;
  if (cuoi < tu) [tu, cuoi] = [cuoi, tu];
  if ((cuoi.getTime() - tu.getTime()) / 864e5 >= SO_NGAY_TOI_DA) {
    cuoi = congNgay(tu, SO_NGAY_TOI_DA - 1);
    canhBao = `Khoảng ngày tối đa ${SO_NGAY_TOI_DA} ngày – đã cắt đến ${ngayInput(cuoi)}`;
  }
  return { tu, den: congNgay(cuoi, 1), tuNgay: ngayInput(tu), denNgay: ngayInput(cuoi), canhBao };
}

type Nhom = { soHoaDon: number; doanhThu: number };
const themVao = <K>(m: Map<K, Nhom & Record<string, unknown>>, k: K, tao: () => Nhom & Record<string, unknown>, tien: number) => {
  const x = m.get(k) ?? tao();
  x.soHoaDon += 1; x.doanhThu += tien;
  m.set(k, x);
};

export const baoCaoService = {
  /** Báo cáo đầy đủ cho khoảng ngày [tu, den). */
  async baoCao({ tu, den }: KhoangNgay, soSachTop = 10) {
    const [hoaDons, huy] = await Promise.all([
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
      prisma.hoaDon.aggregate({
        where: { trangThai: "DA_HUY", phuongThucTT: { not: null }, thoiGianTao: { gte: tu, lt: den } }, _count: true, _sum: { tongTien: true },
      }),
    ]);

    const tong = { soHoaDon: 0, doanhThu: 0, tamTinh: 0, giamCombo: 0, giamHangThe: 0, giamMaGiamGia: 0, giamDiem: 0, thueVAT: 0, soCuon: 0 };
    const theoNgay = new Map<string, Nhom & { soCuon: number }>();
    for (let d = dauNgay(tu); d < den; d = congNgay(d, 1)) theoNgay.set(ngayInput(d), { soHoaDon: 0, doanhThu: 0, soCuon: 0 });
    const theoNhanVien = new Map<number, Nhom & { hoTen: string }>();
    const theoPhuongThuc = new Map<string, Nhom>();
    const theoTheLoai = new Map<string, { tenTL: string; soCuon: number; tienHang: number }>();
    const theoSach = new Map<number, { tenSach: string; tenTL: string; soCuon: number; tienHang: number }>();
    const khach = new Set<number>();

    for (const h of hoaDons) {
      const tien = Number(h.tongTien);
      const soCuon = h.chiTiets.reduce((t, c) => t + c.soLuong, 0);
      tong.soHoaDon += 1; tong.doanhThu += tien; tong.soCuon += soCuon;
      tong.tamTinh += Number(h.tamTinh); tong.giamCombo += Number(h.giamCombo); tong.giamHangThe += Number(h.giamHangThe);
      tong.giamMaGiamGia += Number(h.giamMaGiamGia); tong.giamDiem += Number(h.giamDiem); tong.thueVAT += Number(h.thueVAT);
      if (h.maKH) khach.add(h.maKH);

      const ngay = theoNgay.get(ngayInput(h.thoiGianTao));
      if (ngay) { ngay.soHoaDon += 1; ngay.doanhThu += tien; ngay.soCuon += soCuon; }
      themVao(theoNhanVien, h.taiKhoan.maTK, () => ({ hoTen: h.taiKhoan.hoTen, soHoaDon: 0, doanhThu: 0 }), tien);
      themVao(theoPhuongThuc, h.phuongThucTT ?? "?", () => ({ soHoaDon: 0, doanhThu: 0 }), tien);
      for (const c of h.chiTiets) {
        const tl = c.sach.theLoai.tenTL;
        const x = theoTheLoai.get(tl) ?? { tenTL: tl, soCuon: 0, tienHang: 0 };
        x.soCuon += c.soLuong; x.tienHang += Number(c.thanhTien); theoTheLoai.set(tl, x);
        const s = theoSach.get(c.sach.maSach) ?? { tenSach: c.sach.tenSach, tenTL: tl, soCuon: 0, tienHang: 0 };
        s.soCuon += c.soLuong; s.tienHang += Number(c.thanhTien); theoSach.set(c.sach.maSach, s);
      }
    }

    const giamDan = <T extends { doanhThu?: number; tienHang?: number }>(a: T, b: T) => (b.doanhThu ?? b.tienHang ?? 0) - (a.doanhThu ?? a.tienHang ?? 0);
    return {
      tu, den,
      tong: {
        ...tong,
        tongGiam: tong.giamCombo + tong.giamHangThe + tong.giamMaGiamGia + tong.giamDiem,
        doanhThuTruocThue: tong.doanhThu - tong.thueVAT,
        giaTriTB: tong.soHoaDon ? Math.round(tong.doanhThu / tong.soHoaDon) : 0,
        soKhachThanhVien: khach.size,
        soHoaDonHuy: huy._count, giaTriHuy: Number(huy._sum.tongTien ?? 0),
      },
      theoNgay: [...theoNgay].map(([ngay, x]) => ({ ngay, ...x })),
      theoNhanVien: [...theoNhanVien.values()].sort(giamDan),
      theoPhuongThuc: [...theoPhuongThuc].map(([pt, x]) => ({ pt, ...x })).sort(giamDan),
      theoTheLoai: [...theoTheLoai.values()].sort(giamDan),
      topSach: [...theoSach.values()].sort((a, b) => b.soCuon - a.soCuon || b.tienHang - a.tienHang).slice(0, soSachTop),
    };
  },

  /** Số liệu Dashboard: hôm nay so với hôm qua, tháng này, 7 ngày, top sách 30 ngày, việc cần xử lý. */
  async dashboard(luc = new Date()) {
    const [homNay, homQua, thangNay, bayNgay, baMuoiNgay, choDuyet, sapHet, donDangLap, hoaDonGanDay] = await Promise.all([
      this.baoCao(khoangNgay("homNay", luc)),
      this.baoCao(khoangNgay("homQua", luc)),
      this.baoCao(khoangNgay("thangNay", luc)),
      this.baoCao(khoangNgay("7Ngay", luc)),
      this.baoCao(khoangNgay("30Ngay", luc), 5),
      Promise.all([
        prisma.phieuNhap.count({ where: { trangThai: "CHO_DUYET" } }),
        prisma.phieuKiemKe.count({ where: { trangThai: "CHO_DUYET" } }),
        prisma.phieuXuatHuy.count({ where: { trangThai: "CHO_DUYET" } }),
      ]),
      prisma.sach.count({ where: { trangThai: "DANG_BAN", soLuongTon: { lte: prisma.sach.fields.dinhMucToiThieu } } }),
      prisma.hoaDon.count({ where: { trangThai: "DANG_LAP" } }),
      prisma.hoaDon.findMany({
        where: { trangThai: { in: ["DA_THANH_TOAN", "DA_HUY"] }, phuongThucTT: { not: null } },
        select: { maHD: true, thoiGianTao: true, tongTien: true, trangThai: true, taiKhoan: { select: { hoTen: true } }, khachHang: { select: { hoTen: true } } },
        orderBy: { thoiGianTao: "desc" }, take: 6,
      }),
    ]);
    return {
      homNay: homNay.tong, homQua: homQua.tong, thangNay: thangNay.tong,
      bayNgay: bayNgay.theoNgay, topSach: baMuoiNgay.topSach, theoTheLoai30: baMuoiNgay.theoTheLoai,
      canXuLy: { phieuNhap: choDuyet[0], kiemKe: choDuyet[1], xuatHuy: choDuyet[2], sapHet, donDangLap },
      hoaDonGanDay,
    };
  },
};
