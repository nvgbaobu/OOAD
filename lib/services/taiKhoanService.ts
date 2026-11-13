// Nghiệp vụ quản lý tài khoản (Admin) và đổi mật khẩu cá nhân (mọi người dùng).
// - SĐT là tên đăng nhập: 10 số bắt đầu 0, duy nhất, KHÔNG đổi sau khi tạo.
// - Mật khẩu 6–72 ký tự (giới hạn của bcrypt), hash bằng bcryptjs.
// - Luôn còn ít nhất 1 Admin đang hoạt động; Admin không tự khóa / tự hạ quyền chính mình.
// - Khóa tài khoản: mất quyền ngay ở request kế tiếp (DAL đọc lại DB) + hủy đơn đang lập của người đó (giải phóng tạm giữ).
// - Đổi/đặt lại mật khẩu không làm mất phiên đang mở (phiên JWT không lưu DB – giữ đúng 21 bảng); muốn đuổi ra ngay thì khóa.
import bcrypt from "bcryptjs";
import { LoiNghiepVu } from "@/lib/loi";
import { taiKhoanRepository } from "@/lib/repositories/taiKhoanRepository";
import { nhatKyRepository } from "@/lib/repositories/nhatKyRepository";
import { posService, LY_DO_HUY } from "@/lib/services/posService";
import type { VaiTro } from "@/lib/auth/token";

export const TEN_VAI_TRO: Record<VaiTro, string> = { ADMIN: "Quản trị", STAFF: "Nhân viên" };
export type FormTaiKhoan = { soDienThoai: string; hoTen: string; email: string; vaiTro: string; matKhau?: string };

const chuanHoa = (s: string | undefined) => (s ?? "").trim().replace(/\s+/g, " ");

export function kiemTraMatKhau(matKhau: string, truong: string, loi: Record<string, string>) {
  if (matKhau.length < 6) loi[truong] = "Mật khẩu tối thiểu 6 ký tự";
  else if (Buffer.byteLength(matKhau) > 72) loi[truong] = "Mật khẩu tối đa 72 ký tự";
}

function kiemTraThongTin(f: FormTaiKhoan, loi: Record<string, string>) {
  const hoTen = chuanHoa(f.hoTen);
  const email = f.email.trim() || null;
  const vaiTro = f.vaiTro === "ADMIN" || f.vaiTro === "STAFF" ? (f.vaiTro as VaiTro) : null;
  if (hoTen.length < 2) loi.hoTen = "Nhập họ tên";
  else if (hoTen.length > 100) loi.hoTen = "Tối đa 100 ký tự";
  if (email && (email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) loi.email = "Email không hợp lệ";
  if (!vaiTro) loi.vaiTro = "Chọn vai trò";
  return { hoTen, email, vaiTro: vaiTro! };
}

const nemNeuLoi = (loi: Record<string, string>) => {
  if (Object.keys(loi).length) throw new LoiNghiepVu("Dữ liệu chưa hợp lệ, kiểm tra các ô báo đỏ", loi);
};

export const taiKhoanService = {
  danhSach: () => taiKhoanRepository.danhSach(),
  layChiTiet: (maTK: number) => taiKhoanRepository.layCongKhai(maTK),

  async tao(f: FormTaiKhoan, maTKAdmin: number) {
    const loi: Record<string, string> = {};
    const soDienThoai = f.soDienThoai.replace(/[\s.-]/g, "");
    if (!/^0\d{9}$/.test(soDienThoai)) loi.soDienThoai = "Số điện thoại gồm 10 chữ số, bắt đầu bằng 0";
    else if (await taiKhoanRepository.timTheoSoDienThoai(soDienThoai)) loi.soDienThoai = "Số điện thoại đã có tài khoản";
    const d = kiemTraThongTin(f, loi);
    kiemTraMatKhau(f.matKhau ?? "", "matKhau", loi);
    nemNeuLoi(loi);
    const tk = await taiKhoanRepository.tao({ soDienThoai, ...d, matKhauHash: await bcrypt.hash(f.matKhau!, 10), trangThai: "HOAT_DONG" });
    await nhatKyRepository.ghi({ maTK: maTKAdmin, module: "TAI_KHOAN", hanhDong: "THEM", noiDung: `#${tk.maTK} ${tk.hoTen} – ${soDienThoai} (${d.vaiTro})` });
    return tk;
  },

  async capNhat(maTK: number, f: FormTaiKhoan, maTKAdmin: number) {
    const cu = await taiKhoanRepository.timTheoMa(maTK);
    if (!cu) throw new LoiNghiepVu("Tài khoản không tồn tại");
    const loi: Record<string, string> = {};
    const d = kiemTraThongTin(f, loi);
    if (!loi.vaiTro && cu.vaiTro === "ADMIN" && d.vaiTro !== "ADMIN") {
      if (maTK === maTKAdmin) loi.vaiTro = "Không tự hạ quyền của chính mình";
      else if (cu.trangThai === "HOAT_DONG" && (await taiKhoanRepository.demAdminHoatDong()) <= 1) loi.vaiTro = "Phải còn ít nhất 1 Admin hoạt động";
    }
    nemNeuLoi(loi);
    await taiKhoanRepository.capNhat(maTK, d);
    await nhatKyRepository.ghi({
      maTK: maTKAdmin, module: "TAI_KHOAN", hanhDong: "SUA",
      noiDung: `#${maTK} ${d.hoTen}${cu.vaiTro !== d.vaiTro ? ` (vai trò ${cu.vaiTro} → ${d.vaiTro})` : ""}`,
    });
  },

  async doiTrangThai(maTK: number, khoa: boolean, maTKAdmin: number) {
    const tk = await taiKhoanRepository.timTheoMa(maTK);
    if (!tk) throw new LoiNghiepVu("Tài khoản không tồn tại");
    if (khoa) {
      if (maTK === maTKAdmin) throw new LoiNghiepVu("Không tự khóa tài khoản của chính mình");
      if (tk.vaiTro === "ADMIN" && tk.trangThai === "HOAT_DONG" && (await taiKhoanRepository.demAdminHoatDong()) <= 1) {
        throw new LoiNghiepVu("Phải còn ít nhất 1 Admin hoạt động");
      }
    }
    const trangThai = khoa ? "KHOA" : "HOAT_DONG";
    if (tk.trangThai === trangThai) return;
    await taiKhoanRepository.capNhat(maTK, { trangThai });
    const huyDon = khoa ? await posService.huyDonDangLapCua(maTK, LY_DO_HUY.KHOA_TAI_KHOAN) : false;
    await nhatKyRepository.ghi({
      maTK: maTKAdmin, module: "TAI_KHOAN", hanhDong: khoa ? "KHOA" : "MO_KHOA",
      noiDung: `#${maTK} ${tk.hoTen}${huyDon ? " – đã hủy đơn đang lập" : ""}`,
    });
  },

  /** Admin đặt lại mật khẩu cho người khác (vd: nhân viên quên mật khẩu). */
  async datLaiMatKhau(maTK: number, matKhau: string, nhapLai: string, maTKAdmin: number) {
    const tk = await taiKhoanRepository.timTheoMa(maTK);
    if (!tk) throw new LoiNghiepVu("Tài khoản không tồn tại");
    const loi: Record<string, string> = {};
    kiemTraMatKhau(matKhau, "matKhauMoi", loi);
    if (!loi.matKhauMoi && matKhau !== nhapLai) loi.nhapLai = "Nhập lại không khớp";
    nemNeuLoi(loi);
    await taiKhoanRepository.capNhat(maTK, { matKhauHash: await bcrypt.hash(matKhau, 10) });
    await nhatKyRepository.ghi({ maTK: maTKAdmin, module: "TAI_KHOAN", hanhDong: "DAT_LAI_MAT_KHAU", noiDung: `#${maTK} ${tk.hoTen}` });
  },

  /** Người dùng tự đổi mật khẩu (phải nhập đúng mật khẩu hiện tại). */
  async doiMatKhau(maTK: number, matKhauCu: string, matKhauMoi: string, nhapLai: string) {
    const tk = await taiKhoanRepository.timTheoMa(maTK);
    if (!tk) throw new LoiNghiepVu("Tài khoản không tồn tại");
    const loi: Record<string, string> = {};
    if (!(await bcrypt.compare(matKhauCu, tk.matKhauHash))) loi.matKhauCu = "Mật khẩu hiện tại không đúng";
    kiemTraMatKhau(matKhauMoi, "matKhauMoi", loi);
    if (!loi.matKhauMoi && matKhauMoi === matKhauCu) loi.matKhauMoi = "Mật khẩu mới phải khác mật khẩu hiện tại";
    if (!loi.matKhauMoi && matKhauMoi !== nhapLai) loi.nhapLai = "Nhập lại không khớp";
    nemNeuLoi(loi);
    await taiKhoanRepository.capNhat(maTK, { matKhauHash: await bcrypt.hash(matKhauMoi, 10) });
    await nhatKyRepository.ghi({ maTK, module: "TAI_KHOAN", hanhDong: "DOI_MAT_KHAU" });
  },
};
