// UC1.4 – Khôi phục mật khẩu bằng OTP (giả lập gửi SMS: mã hiện trên màn hình + in ra console server).
// Luồng: nhập SĐT → cấp OTP 6 số (hạn 5 phút, vô hiệu mã cũ) → nhập OTP → nhập mật khẩu mới (kiểm tra lại OTP, đánh dấu
// đã dùng bằng UPDATE có điều kiện → mỗi mã chỉ dùng được 1 lần).
// Chống dò mã: mỗi OTP cho sai tối đa SO_LAN_SAI_TOI_DA lần (đếm qua nhật ký OTP_SAI – bảng MaOTP không có cột đếm,
// giữ đúng lược đồ báo cáo), quá số lần thì mã bị vô hiệu, phải gửi lại mã mới.
import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { LoiNghiepVu } from "@/lib/loi";
import { taiKhoanRepository } from "@/lib/repositories/taiKhoanRepository";
import { maOTPRepository } from "@/lib/repositories/maOTPRepository";
import { nhatKyRepository } from "@/lib/repositories/nhatKyRepository";
import { kiemTraMatKhau } from "@/lib/services/taiKhoanService";

export const HAN_OTP_PHUT = 5;
export const SO_LAN_SAI_TOI_DA = 5;
const MODULE = "TAI_KHOAN";

const chuanHoaSDT = (s: string) => s.replace(/[\s.-]/g, "");

/** Tài khoản theo SĐT; ném lỗi nếu SĐT sai định dạng / không tồn tại / bị khóa. */
async function layTaiKhoan(soDienThoaiTho: string) {
  const soDienThoai = chuanHoaSDT(soDienThoaiTho);
  if (!/^0\d{9}$/.test(soDienThoai)) {
    throw new LoiNghiepVu("Số điện thoại gồm 10 chữ số, bắt đầu bằng 0", { soDienThoai: "Số điện thoại gồm 10 chữ số, bắt đầu bằng 0" });
  }
  const tk = await taiKhoanRepository.timTheoSoDienThoai(soDienThoai);
  if (!tk) {
    throw new LoiNghiepVu("Không tìm thấy tài khoản với số điện thoại này", { soDienThoai: "Không tìm thấy tài khoản với số điện thoại này" });
  }
  if (tk.trangThai !== "HOAT_DONG") {
    throw new LoiNghiepVu("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên", { soDienThoai: "Tài khoản đã bị khóa" });
  }
  return tk;
}

/** Kiểm tra OTP người dùng nhập với mã chưa dùng mới nhất; trả về bản ghi OTP hợp lệ hoặc ném lỗi (5a, 5b). */
async function kiemTraOTP(maTK: number, maCodeTho: string) {
  const maCode = maCodeTho.trim();
  const otp = await maOTPRepository.layMaChuaDung(prisma, maTK);
  if (!otp) throw new LoiNghiepVu("Mã OTP không còn hiệu lực. Vui lòng gửi lại mã", { maCode: "Hãy gửi lại mã mới", hetHan: "1" });
  if (otp.thoiGianHetHan.getTime() < Date.now()) {
    throw new LoiNghiepVu("Mã OTP đã hết hạn", { maCode: "Mã OTP đã hết hạn", hetHan: "1" });
  }
  if (!/^\d{6}$/.test(maCode) || maCode !== otp.maCode) {
    await nhatKyRepository.ghi({ maTK, module: MODULE, hanhDong: "OTP_SAI", noiDung: `OTP #${otp.maOTP}` });
    const soLanSai = await prisma.nhatKyHeThong.count({ where: { maTK, module: MODULE, hanhDong: "OTP_SAI", noiDung: `OTP #${otp.maOTP}` } });
    if (soLanSai >= SO_LAN_SAI_TOI_DA) {
      await maOTPRepository.danhDauDaDung(prisma, otp.maOTP);
      throw new LoiNghiepVu(`Nhập sai ${SO_LAN_SAI_TOI_DA} lần – mã OTP đã bị hủy. Vui lòng gửi lại mã`, { maCode: "Mã đã bị hủy", hetHan: "1" });
    }
    throw new LoiNghiepVu("Mã OTP không chính xác", { maCode: `Mã OTP không chính xác (còn ${SO_LAN_SAI_TOI_DA - soLanSai} lần thử)` });
  }
  return otp;
}

export const matKhauService = {
  /** Bước 1: cấp OTP mới cho SĐT. Trả về mã để giao diện hiển thị "SMS giả lập". */
  async yeuCauOTP(soDienThoaiTho: string) {
    const tk = await layTaiKhoan(soDienThoaiTho);
    const maCode = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const hetHanLuc = new Date(Date.now() + HAN_OTP_PHUT * 60_000);
    await prisma.$transaction(async (tx) => {
      await maOTPRepository.voHieuMaCu(tx, tk.maTK);
      const otp = await maOTPRepository.tao(tx, tk.maTK, maCode, hetHanLuc);
      await nhatKyRepository.ghi({ maTK: tk.maTK, module: MODULE, hanhDong: "YEU_CAU_OTP", noiDung: `OTP #${otp.maOTP} – hết hạn ${hetHanLuc.toLocaleTimeString("vi-VN")}` }, tx);
    });
    console.log(`[SMS giả lập] Gửi tới ${tk.soDienThoai}: mã OTP khôi phục mật khẩu là ${maCode} (hết hạn ${hetHanLuc.toLocaleTimeString("vi-VN")})`);
    return { soDienThoai: tk.soDienThoai, maCode, hetHanLuc };
  },

  /** Bước 2: xác nhận OTP (chưa đánh dấu đã dùng – bước 3 sẽ kiểm tra lại). */
  async xacNhanOTP(soDienThoaiTho: string, maCode: string) {
    const tk = await layTaiKhoan(soDienThoaiTho);
    await kiemTraOTP(tk.maTK, maCode);
  },

  /** Bước 3: đặt mật khẩu mới – kiểm tra lại OTP, dùng OTP đúng 1 lần, hash bcrypt. */
  async datLaiMatKhau(soDienThoaiTho: string, maCode: string, matKhauMoi: string, nhapLai: string) {
    const tk = await layTaiKhoan(soDienThoaiTho);
    const loi: Record<string, string> = {};
    kiemTraMatKhau(matKhauMoi, "matKhauMoi", loi);
    if (!loi.matKhauMoi && matKhauMoi !== nhapLai) loi.nhapLai = "Nhập lại không khớp";
    if (Object.keys(loi).length) throw new LoiNghiepVu("Dữ liệu chưa hợp lệ, kiểm tra các ô báo đỏ", loi);

    const otp = await kiemTraOTP(tk.maTK, maCode);
    const hash = await bcrypt.hash(matKhauMoi, 10);
    await prisma.$transaction(async (tx) => {
      if (!(await maOTPRepository.danhDauDaDung(tx, otp.maOTP))) {
        throw new LoiNghiepVu("Mã OTP đã được sử dụng. Vui lòng gửi lại mã", { maCode: "Mã đã được sử dụng", hetHan: "1" });
      }
      await tx.taiKhoan.update({ where: { maTK: tk.maTK }, data: { matKhauHash: hash } });
      await nhatKyRepository.ghi({ maTK: tk.maTK, module: MODULE, hanhDong: "DAT_LAI_MAT_KHAU_OTP", noiDung: `OTP #${otp.maOTP}` }, tx);
    });
  },
};
