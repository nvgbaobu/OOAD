// Nghiệp vụ tra cứu và hủy hóa đơn.
// - Staff chỉ thấy hóa đơn do mình lập; Admin thấy tất cả. Không liệt kê đơn đang lập (giỏ hàng POS).
// - Hủy hóa đơn ĐÃ THANH TOÁN (chỉ Admin, bắt buộc lý do), trong 1 transaction:
//   chuyển DA_HUY (có điều kiện: còn DA_THANH_TOAN) → hoàn kho từng dòng → khách: hoàn điểm đã dùng, trừ điểm đã cộng
//   (thiếu thì về 0), trừ điểm tích lũy, xét lại hạng theo điểm tích lũy → hoàn 1 lượt mã giảm giá → nhật ký.
//   Hóa đơn giữ nguyên số tiền để đối chiếu; báo cáo doanh thu chỉ tính DA_THANH_TOAN.
import { prisma } from "@/lib/prisma";
import { LoiNghiepVu } from "@/lib/loi";
import { hoaDonRepository, type LocHoaDon } from "@/lib/repositories/hoaDonRepository";
import { nhatKyRepository } from "@/lib/repositories/nhatKyRepository";
import { cauHinhRepository } from "@/lib/repositories/cauHinhRepository";
import { HoaDon } from "@/lib/thucThe/HoaDon";
import { Sach } from "@/lib/thucThe/Sach";
import { KhachHang } from "@/lib/thucThe/KhachHang";
import { HangThanhVien } from "@/lib/thucThe/HangThanhVien";
import { MaGiamGia } from "@/lib/thucThe/MaGiamGia";

export const SO_HOA_DON_MOI_TRANG = 20;
export const TRANG_THAI_HOA_DON = { DA_THANH_TOAN: "Đã thanh toán", DA_HUY: "Đã hủy (sau thanh toán)", NHAP_HUY: "Đơn nháp đã hủy" } as const;
export type NguoiXem = { maTK: number; vaiTro: string };

export const hoaDonService = {
  async danhSach(loc: LocHoaDon, trang: number, nguoiXem: NguoiXem) {
    // UC5.1 luồng 3a: khoảng thời gian không hợp lệ (ngày bắt đầu sau ngày kết thúc) → báo lỗi, không tra cứu
    // (denNgay đã là 0:00 của ngày SAU ngày kết thúc người dùng chọn)
    if (loc.tuNgay && loc.denNgay && loc.tuNgay >= loc.denNgay) {
      return {
        hoaDons: [], soHoaDon: 0, soDaThanhToan: 0, doanhThu: 0, soTrang: 1, trang: 1,
        loi: "Khoảng thời gian không hợp lệ: ngày bắt đầu sau ngày kết thúc. Vui lòng chọn lại.",
      };
    }
    const locThat: LocHoaDon = nguoiXem.vaiTro === "ADMIN" ? loc : { ...loc, maTK: nguoiXem.maTK };
    const tongHop = await hoaDonRepository.tongHop(locThat);
    const soTrang = Math.max(1, Math.ceil(tongHop.soHoaDon / SO_HOA_DON_MOI_TRANG));
    const trangHienTai = Math.min(Math.max(1, trang), soTrang);
    const hoaDons = await hoaDonRepository.danhSach(locThat, (trangHienTai - 1) * SO_HOA_DON_MOI_TRANG, SO_HOA_DON_MOI_TRANG);
    return { hoaDons, ...tongHop, soTrang, trang: trangHienTai, loi: undefined as string | undefined };
  },

  /** Chi tiết hóa đơn (không phải đơn đang lập); Staff chỉ xem được hóa đơn của mình. */
  async xem(maHD: number, nguoiXem: NguoiXem) {
    const hd = await hoaDonRepository.layHoaDonDayDu(maHD);
    if (!hd || hd.trangThai === "DANG_LAP") return null;
    if (nguoiXem.vaiTro !== "ADMIN" && hd.maTK !== nguoiXem.maTK) return null;
    const { tyLeQuyDoiDiem } = await cauHinhRepository.lay();
    const hoaDon = new HoaDon(hd);
    // Trả object thường cho giao diện; các số suy ra tính bằng phương thức của lớp HoaDon
    return { ...hd, diemCong: hd.maKH ? hoaDon.tinhDiemCong(Number(tyLeQuyDoiDiem)) : 0, tienThoiLai: hoaDon.tienThoiLai() };
  },

  nhanVien: () => prisma.taiKhoan.findMany({ select: { maTK: true, hoTen: true }, orderBy: { hoTen: "asc" } }),

  async huy(maHD: number, lyDoTho: string, maTK: number) {
    const lyDo = lyDoTho.trim().replace(/\s+/g, " ");
    if (!lyDo) throw new LoiNghiepVu("Lý do hủy là bắt buộc", { lyDoHuy: "Lý do hủy là bắt buộc" });
    if (lyDo.length > 255) throw new LoiNghiepVu("Lý do tối đa 255 ký tự", { lyDoHuy: "Tối đa 255 ký tự" });

    await prisma.$transaction(async (tx) => {
      const hd = await tx.hoaDon.findUnique({
        where: { maHD },
        include: { chiTiets: { include: { sach: { select: { tenSach: true } } } }, khachHang: { include: { hangThanhVien: true } }, maGiamGia: true },
      });
      if (!hd) throw new LoiNghiepVu("Hóa đơn không tồn tại");
      const loiTrangThai = hd.trangThai === "DA_HUY" ? "Hóa đơn đã bị hủy trước đó" : "Chỉ hủy được hóa đơn đã thanh toán";
      if (hd.trangThai !== "DA_THANH_TOAN") throw new LoiNghiepVu(loiTrangThai); // đơn nháp (DANG_LAP) hủy ở POS
      const hoaDon = new HoaDon(hd);
      // UPDATE có điều kiện "còn DA_THANH_TOAN" – Admin khác vừa hủy thì báo đã hủy
      if (!(await hoaDon.huyHoaDon(lyDo, tx))) throw new LoiNghiepVu("Hóa đơn đã bị hủy trước đó");

      for (const c of hd.chiTiets) await Sach.thamChieu(c.maSach).congTon(c.soLuong, tx); // hoàn kho

      const ghiChu: string[] = [`hoàn kho ${hd.chiTiets.reduce((t, c) => t + c.soLuong, 0)} cuốn`];
      if (hd.khachHang) {
        const kh = hd.khachHang;
        const khach = new KhachHang(kh);
        const { tyLeQuyDoiDiem } = await cauHinhRepository.lay(tx);
        const diemCong = hoaDon.tinhDiemCong(Number(tyLeQuyDoiDiem));
        const thieu = await khach.hoanDiem(hd.diemSuDung, diemCong, tx);
        ghiChu.push(`KH ${kh.soDienThoai}: +${hd.diemSuDung} điểm đã dùng, −${diemCong} điểm đã cộng${thieu ? ` (khách đã tiêu, hụt ${thieu} điểm)` : ""}`);
        // Xét lại hạng theo điểm tích lũy mới (có thể hạ nếu hóa đơn này đã giúp khách lên hạng)
        const moi = await tx.khachHang.findUniqueOrThrow({ where: { maKH: kh.maKH }, select: { diemTichLuy: true } });
        const hang = await HangThanhVien.xacDinhHang(moi.diemTichLuy, tx);
        if (hang && hang.maHang !== kh.maHang && hang.diemToiThieu < kh.hangThanhVien.diemToiThieu) {
          await khach.capNhatHang(hang, tx);
          ghiChu.push(`hạng ${kh.hangThanhVien.tenHang} → ${hang.tenHang}`);
        }
      }
      if (hd.maGiamGia && (await new MaGiamGia(hd.maGiamGia).hoanLuotDung(tx))) {
        ghiChu.push(`hoàn 1 lượt mã ${hd.maGiamGia.maCode}`);
      }
      await nhatKyRepository.ghi({ maTK, module: "HOA_DON", hanhDong: "HUY", noiDung: `#${maHD} (${Number(hd.tongTien)}đ) – ${lyDo}; ${ghiChu.join("; ")}` }, tx);
    });
  },
};
