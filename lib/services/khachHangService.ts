// Nghiệp vụ khách hàng thành viên – dùng chung cho POS (tạo nhanh) và màn hình Khách hàng.
// - Staff và Admin: tra cứu, thêm, sửa thông tin. Điểm KHÔNG sửa tay – chỉ đổi qua thanh toán / hủy hóa đơn.
// - Chỉ Admin: xóa khách (chỉ khi chưa có hóa đơn nào), cấu hình hạng thành viên.
// - Hạng của khách = hạng có diemToiThieu cao nhất ≤ diemTichLuy. Đổi cấu hình hạng → xét lại hạng toàn bộ khách.
import { prisma } from "@/lib/prisma";
import { LoiNghiepVu } from "@/lib/loi";
import type { Db } from "@/lib/db";
import { khachHangRepository, type LocKhachHang } from "@/lib/repositories/khachHangRepository";
import { nhatKyRepository } from "@/lib/repositories/nhatKyRepository";

export class LoiKhachHang extends LoiNghiepVu {}

export type DuLieuKhachHang = { soDienThoai: string; hoTen: string; email?: string | null; diaChi?: string | null };

export const SDT_HOP_LE = /^0\d{9}$/;
export const SO_KHACH_MOI_TRANG = 20;

/** Chuẩn hóa + kiểm tra dữ liệu; gom lỗi theo ô rồi ném 1 LoiKhachHang (message = lỗi đầu tiên, dùng cho POS). */
async function kiemTra(d: DuLieuKhachHang, db: Db, maKHDangSua?: number): Promise<DuLieuKhachHang> {
  const loi: Record<string, string> = {};
  const soDienThoai = d.soDienThoai.trim().replace(/[\s.-]/g, "");
  const hoTen = d.hoTen.trim().replace(/\s+/g, " ");
  const email = d.email?.trim() || null;
  const diaChi = d.diaChi?.trim().replace(/\s+/g, " ") || null;
  if (!SDT_HOP_LE.test(soDienThoai)) loi.soDienThoai = "Số điện thoại gồm 10 chữ số, bắt đầu bằng 0";
  else {
    const trung = await khachHangRepository.timTheoSoDienThoai(db, soDienThoai);
    if (trung && trung.maKH !== maKHDangSua) loi.soDienThoai = `Số điện thoại ${soDienThoai} đã được đăng ký (${trung.hoTen})`;
  }
  if (hoTen.length < 2) loi.hoTen = "Nhập họ tên khách hàng";
  else if (hoTen.length > 100) loi.hoTen = "Họ tên tối đa 100 ký tự";
  if (email && (email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) loi.email = "Email không hợp lệ";
  if (diaChi && diaChi.length > 255) loi.diaChi = "Địa chỉ tối đa 255 ký tự";
  const cacLoi = Object.values(loi);
  if (cacLoi.length) throw new LoiKhachHang(cacLoi.length === 1 ? cacLoi[0] : "Dữ liệu chưa hợp lệ, kiểm tra các ô báo đỏ", loi);
  return { soDienThoai, hoTen, email, diaChi };
}

// ───────── Hạng thành viên ─────────

export type FormHang = { tenHang: string; diemToiThieu: string; phanTramUuDai: string };

async function kiemTraHang(f: FormHang, maHangDangSua: number | null) {
  const loi: Record<string, string> = {};
  const tenHang = f.tenHang.trim().replace(/\s+/g, " ");
  const diemToiThieu = f.diemToiThieu.trim() === "" ? NaN : Number(f.diemToiThieu);
  const phanTramUuDai = f.phanTramUuDai.trim() === "" ? NaN : Number(f.phanTramUuDai);
  const khac = (await prisma.hangThanhVien.findMany()).filter((h) => h.maHang !== maHangDangSua);
  if (!tenHang) loi.tenHang = "Nhập tên hạng";
  else if (tenHang.length > 50) loi.tenHang = "Tối đa 50 ký tự";
  else if (khac.some((h) => h.tenHang.toLowerCase() === tenHang.toLowerCase())) loi.tenHang = "Tên hạng đã tồn tại";
  if (!Number.isInteger(diemToiThieu) || diemToiThieu < 0) loi.diemToiThieu = "Điểm tối thiểu là số nguyên ≥ 0";
  else if (khac.some((h) => h.diemToiThieu === diemToiThieu)) loi.diemToiThieu = "Đã có hạng khác cùng mốc điểm";
  else if (diemToiThieu > 0 && !khac.some((h) => h.diemToiThieu === 0)) loi.diemToiThieu = "Phải luôn có 1 hạng mốc 0 điểm (hạng của khách mới)";
  if (!Number.isFinite(phanTramUuDai) || phanTramUuDai < 0 || phanTramUuDai > 50 || Math.round(phanTramUuDai * 100) !== phanTramUuDai * 100) {
    loi.phanTramUuDai = "Ưu đãi từ 0 đến 50%, tối đa 2 chữ số thập phân";
  }
  const cacLoi = Object.values(loi);
  if (cacLoi.length) throw new LoiNghiepVu(cacLoi.join(". "), loi);
  return { tenHang, diemToiThieu, phanTramUuDai };
}

export const khachHangService = {
  /** Tạo khách hàng mới, gán hạng thấp nhất, 0 điểm. */
  async taoMoi(duLieu: DuLieuKhachHang, maTKThucHien: number, db: Db = prisma) {
    const d = await kiemTra(duLieu, db);
    const hang = await khachHangRepository.hangThapNhat(db);
    if (!hang) throw new Error("Chưa có hạng thành viên nào (HangThanhVien). Hãy chạy seed.");
    const kh = await khachHangRepository.tao(db, { ...d, maHang: hang.maHang, diemHienTai: 0, diemTichLuy: 0 });
    await nhatKyRepository.ghi(
      { maTK: maTKThucHien, module: "KHACH_HANG", hanhDong: "THEM", noiDung: `KH #${kh.maKH} ${kh.hoTen} – ${kh.soDienThoai}` },
      db,
    );
    return kh;
  },

  async capNhat(maKH: number, duLieu: DuLieuKhachHang, maTK: number) {
    const cu = await prisma.khachHang.findUnique({ where: { maKH } });
    if (!cu) throw new LoiKhachHang("Khách hàng không tồn tại");
    const d = await kiemTra(duLieu, prisma, maKH);
    await prisma.khachHang.update({ where: { maKH }, data: d });
    await nhatKyRepository.ghi({
      maTK, module: "KHACH_HANG", hanhDong: "SUA",
      noiDung: `KH #${maKH} ${d.hoTen}${cu.soDienThoai !== d.soDienThoai ? ` (SĐT ${cu.soDienThoai} → ${d.soDienThoai})` : ""}`,
    });
  },

  async xoa(maKH: number, maTK: number) {
    const kh = await prisma.khachHang.findUnique({ where: { maKH }, include: { _count: { select: { hoaDons: true } } } });
    if (!kh) throw new LoiKhachHang("Khách hàng không tồn tại");
    if (kh._count.hoaDons) throw new LoiKhachHang(`Không xóa được: khách đã có ${kh._count.hoaDons} hóa đơn`);
    await prisma.khachHang.delete({ where: { maKH } });
    await nhatKyRepository.ghi({ maTK, module: "KHACH_HANG", hanhDong: "XOA", noiDung: `${kh.hoTen} – ${kh.soDienThoai}` });
  },

  async danhSach(loc: LocKhachHang, trang: number) {
    const tong = await khachHangRepository.dem(loc);
    const soTrang = Math.max(1, Math.ceil(tong / SO_KHACH_MOI_TRANG));
    const trangHienTai = Math.min(Math.max(1, trang), soTrang);
    const khachs = await khachHangRepository.danhSach(loc, (trangHienTai - 1) * SO_KHACH_MOI_TRANG, SO_KHACH_MOI_TRANG);
    const thongKe = await khachHangRepository.thongKeMua(khachs.map((k) => k.maKH));
    return { khachs: khachs.map((k) => ({ ...k, ...(thongKe.get(k.maKH) ?? { soHoaDon: 0, tongChiTieu: 0 }) })), tong, soTrang, trang: trangHienTai };
  },

  /** Chi tiết khách + thống kê mua + lịch sử điểm (suy ra từ hóa đơn) + hạng kế tiếp. */
  async layChiTiet(maKH: number) {
    const kh = await prisma.khachHang.findUnique({ where: { maKH }, include: { hangThanhVien: true } });
    if (!kh) return null;
    const [thongKe, hoaDons, hangKeTiep] = await Promise.all([
      khachHangRepository.thongKeMua([maKH]),
      prisma.hoaDon.findMany({
        where: { maKH, phuongThucTT: { not: null } }, // đã thanh toán (kể cả đã hủy sau đó)
        select: { maHD: true, maTK: true, thoiGianTao: true, thoiGianCapNhat: true, trangThai: true, tongTien: true, diemCong: true, diemSuDung: true, lyDoHuy: true },
        orderBy: { maHD: "desc" }, take: 50,
      }),
      prisma.hangThanhVien.findFirst({ where: { diemToiThieu: { gt: kh.diemTichLuy } }, orderBy: { diemToiThieu: "asc" } }),
    ]);
    return { kh, ...(thongKe.get(maKH) ?? { soHoaDon: 0, tongChiTieu: 0 }), hoaDons, hangKeTiep };
  },

  // ───────── Hạng thành viên (Admin) ─────────

  danhSachHang: () => prisma.hangThanhVien.findMany({ include: { _count: { select: { khachHangs: true } } }, orderBy: { diemToiThieu: "asc" } }),

  /** Thêm (maHang null) / sửa hạng, rồi xét lại hạng toàn bộ khách. Trả về số khách đổi hạng. */
  async luuHang(maHang: number | null, f: FormHang, maTK: number) {
    const d = await kiemTraHang(f, maHang);
    return prisma.$transaction(async (tx) => {
      if (maHang === null) await tx.hangThanhVien.create({ data: d });
      else {
        const cu = await tx.hangThanhVien.findUnique({ where: { maHang } });
        if (!cu) throw new LoiNghiepVu("Hạng không tồn tại");
        if (cu.diemToiThieu === 0 && d.diemToiThieu !== 0) {
          throw new LoiNghiepVu("Hạng mốc 0 điểm là hạng của khách mới – không đổi mốc điểm", { diemToiThieu: "Giữ 0" });
        }
        await tx.hangThanhVien.update({ where: { maHang }, data: d });
      }
      const soDoi = await khachHangRepository.xetLaiHang(tx);
      await nhatKyRepository.ghi({
        maTK, module: "HANG_THANH_VIEN", hanhDong: maHang === null ? "THEM" : "SUA",
        noiDung: `${d.tenHang}: từ ${d.diemToiThieu} điểm, ưu đãi ${d.phanTramUuDai}%; ${soDoi} khách đổi hạng`,
      }, tx);
      return soDoi;
    });
  },

  async xoaHang(maHang: number, maTK: number) {
    return prisma.$transaction(async (tx) => {
      const h = await tx.hangThanhVien.findUnique({ where: { maHang } });
      if (!h) throw new LoiNghiepVu("Hạng không tồn tại");
      if (h.diemToiThieu === 0) throw new LoiNghiepVu("Không xóa được hạng mốc 0 điểm (hạng của khách mới)");
      const soDoi = await khachHangRepository.xetLaiHang(tx, maHang); // chuyển khách sang hạng khác trước khi xóa
      await tx.hangThanhVien.delete({ where: { maHang } });
      await nhatKyRepository.ghi({ maTK, module: "HANG_THANH_VIEN", hanhDong: "XOA", noiDung: `${h.tenHang}; ${soDoi} khách đổi hạng` }, tx);
      return soDoi;
    });
  },
};
