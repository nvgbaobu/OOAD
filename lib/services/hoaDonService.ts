// Nghiệp vụ tra cứu và hủy hóa đơn.
// - Staff chỉ thấy hóa đơn do mình lập; Admin thấy tất cả. Không liệt kê đơn đang lập (giỏ hàng POS).
// - Hủy hóa đơn ĐÃ THANH TOÁN (chỉ Admin, bắt buộc lý do), trong 1 transaction:
//   chuyển DA_HUY (có điều kiện: còn DA_THANH_TOAN) → hoàn kho từng dòng → khách: hoàn điểm đã dùng, trừ điểm đã cộng
//   (thiếu thì về 0), trừ điểm tích lũy, xét lại hạng theo điểm tích lũy → hoàn 1 lượt mã giảm giá → nhật ký.
//   Hóa đơn giữ nguyên số tiền để đối chiếu; báo cáo doanh thu chỉ tính DA_THANH_TOAN.
import { prisma } from "@/lib/prisma";
import { LoiNghiepVu } from "@/lib/loi";
import { hoaDonRepository, type LocHoaDon } from "@/lib/repositories/hoaDonRepository";
import { khachHangRepository } from "@/lib/repositories/khachHangRepository";
import { maGiamGiaRepository } from "@/lib/repositories/maGiamGiaRepository";
import { sachRepository } from "@/lib/repositories/sachRepository";
import { nhatKyRepository } from "@/lib/repositories/nhatKyRepository";
import { cauHinhRepository } from "@/lib/repositories/cauHinhRepository";
import { tinhDiemCong } from "@/lib/services/tinhTienHoaDon";

export const SO_HOA_DON_MOI_TRANG = 20;
export const TRANG_THAI_HOA_DON = { DA_THANH_TOAN: "Đã thanh toán", DA_HUY: "Đã hủy (sau thanh toán)", NHAP_HUY: "Đơn nháp đã hủy" } as const;
export type NguoiXem = { maTK: number; vaiTro: string };

export const hoaDonService = {
  async danhSach(loc: LocHoaDon, trang: number, nguoiXem: NguoiXem) {
    const locThat: LocHoaDon = nguoiXem.vaiTro === "ADMIN" ? loc : { ...loc, maTK: nguoiXem.maTK };
    const tongHop = await hoaDonRepository.tongHop(locThat);
    const soTrang = Math.max(1, Math.ceil(tongHop.soHoaDon / SO_HOA_DON_MOI_TRANG));
    const trangHienTai = Math.min(Math.max(1, trang), soTrang);
    const hoaDons = await hoaDonRepository.danhSach(locThat, (trangHienTai - 1) * SO_HOA_DON_MOI_TRANG, SO_HOA_DON_MOI_TRANG);
    return { hoaDons, ...tongHop, soTrang, trang: trangHienTai };
  },

  /** Chi tiết hóa đơn (không phải đơn đang lập); Staff chỉ xem được hóa đơn của mình. */
  async xem(maHD: number, nguoiXem: NguoiXem) {
    const hd = await hoaDonRepository.layHoaDonDayDu(maHD);
    if (!hd || hd.trangThai === "DANG_LAP") return null;
    if (nguoiXem.vaiTro !== "ADMIN" && hd.maTK !== nguoiXem.maTK) return null;
    const { tyLeQuyDoiDiem } = await cauHinhRepository.lay();
    return { ...hd, diemCong: hd.maKH ? tinhDiemCong(Number(hd.tongTien), Number(tyLeQuyDoiDiem)) : 0 };
  },

  nhanVien: () => prisma.taiKhoan.findMany({ select: { maTK: true, hoTen: true }, orderBy: { hoTen: "asc" } }),

  async huy(maHD: number, lyDoTho: string, maTK: number) {
    const lyDo = lyDoTho.trim().replace(/\s+/g, " ");
    if (!lyDo) throw new LoiNghiepVu("Nhập lý do hủy hóa đơn", { lyDoHuy: "Bắt buộc" });
    if (lyDo.length > 255) throw new LoiNghiepVu("Lý do tối đa 255 ký tự", { lyDoHuy: "Tối đa 255 ký tự" });

    await prisma.$transaction(async (tx) => {
      const hd = await tx.hoaDon.findUnique({
        where: { maHD },
        include: { chiTiets: { include: { sach: { select: { tenSach: true } } } }, khachHang: { include: { hangThanhVien: true } }, maGiamGia: true },
      });
      if (!hd) throw new LoiNghiepVu("Hóa đơn không tồn tại");
      if (!(await hoaDonRepository.huyDaThanhToan(tx, maHD, lyDo))) {
        throw new LoiNghiepVu(hd.trangThai === "DA_HUY" ? "Hóa đơn đã bị hủy trước đó" : "Chỉ hủy được hóa đơn đã thanh toán");
      }

      for (const c of hd.chiTiets) await sachRepository.dieuChinhTon(tx, c.maSach, c.soLuong);

      const ghiChu: string[] = [`hoàn kho ${hd.chiTiets.reduce((t, c) => t + c.soLuong, 0)} cuốn`];
      if (hd.khachHang) {
        const kh = hd.khachHang;
        const { tyLeQuyDoiDiem } = await cauHinhRepository.lay(tx);
        const diemCong = tinhDiemCong(Number(hd.tongTien), Number(tyLeQuyDoiDiem));
        const thieu = await khachHangRepository.hoanDiemKhiHuy(tx, kh.maKH, hd.diemSuDung, diemCong);
        ghiChu.push(`KH ${kh.soDienThoai}: +${hd.diemSuDung} điểm đã dùng, −${diemCong} điểm đã cộng${thieu ? ` (khách đã tiêu, hụt ${thieu} điểm)` : ""}`);
        // Xét lại hạng theo điểm tích lũy mới (có thể hạ nếu hóa đơn này đã giúp khách lên hạng)
        const moi = await tx.khachHang.findUniqueOrThrow({ where: { maKH: kh.maKH }, select: { diemTichLuy: true } });
        const hang = await khachHangRepository.hangTheoDiem(tx, moi.diemTichLuy);
        if (hang && hang.maHang !== kh.maHang && hang.diemToiThieu < kh.hangThanhVien.diemToiThieu) {
          await tx.khachHang.update({ where: { maKH: kh.maKH }, data: { maHang: hang.maHang } });
          ghiChu.push(`hạng ${kh.hangThanhVien.tenHang} → ${hang.tenHang}`);
        }
      }
      if (hd.maGiamGia && (await maGiamGiaRepository.giamLuotDung(tx, hd.maGiamGia.maMGG))) {
        ghiChu.push(`hoàn 1 lượt mã ${hd.maGiamGia.maCode}`);
      }
      await nhatKyRepository.ghi({ maTK, module: "HOA_DON", hanhDong: "HUY", noiDung: `#${maHD} (${Number(hd.tongTien)}đ) – ${lyDo}; ${ghiChu.join("; ")}` }, tx);
    });
  },
};
