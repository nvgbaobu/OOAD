// Kiểm thử UC1.4 Khôi phục mật khẩu bằng OTP trên DB thật. Chạy: npm run test:quen-mat-khau (chạy xong tự seed lại)
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { LoiNghiepVu } from "../lib/loi";
import { matKhauService, SO_LAN_SAI_TOI_DA } from "../lib/services/matKhauService";
import { authService } from "../lib/services/authService";
import { taiKhoanService } from "../lib/services/taiKhoanService";

let loi = 0;
const kiemTra = (dk: boolean, moTa: string) => { console.log(dk ? "  ✔" : "  ✘", moTa); if (!dk) loi++; };
async function phaiLoi(fn: () => Promise<unknown>, truong: string | null, chua: string) {
  try { await fn(); kiemTra(false, `phải báo lỗi "${chua}"`); }
  catch (e) {
    const msg = e instanceof LoiNghiepVu ? (truong ? e.loiTruong?.[truong] : e.message) ?? "" : String(e);
    kiemTra(e instanceof LoiNghiepVu && msg.includes(chua), `báo lỗi${truong ? ` ô ${truong}` : ""}: ${msg}`);
  }
}
const SDT = "0900000002"; // Lê Hoàng An (Staff)
const otpChuaDung = async (maTK: number) => prisma.maOTP.count({ where: { maTK, daSuDung: false } });
const maSai = (ma: string) => String((Number(ma) + 1) % 1_000_000).padStart(6, "0");

async function main() {
  const an = await prisma.taiKhoan.findUniqueOrThrow({ where: { soDienThoai: SDT } });

  console.log("1. Yêu cầu OTP");
  await phaiLoi(() => matKhauService.yeuCauOTP("0999999999"), "soDienThoai", "Không tìm thấy tài khoản");
  await phaiLoi(() => matKhauService.yeuCauOTP("123"), "soDienThoai", "10 chữ số");
  await taiKhoanService.doiTrangThai(an.maTK, true, 1);
  await phaiLoi(() => matKhauService.yeuCauOTP(SDT), "soDienThoai", "bị khóa");
  await taiKhoanService.doiTrangThai(an.maTK, false, 1);
  const lan1 = await matKhauService.yeuCauOTP("0900 000 002");
  const otp1 = await prisma.maOTP.findFirstOrThrow({ where: { maTK: an.maTK }, orderBy: { maOTP: "desc" } });
  const phut = (otp1.thoiGianHetHan.getTime() - Date.now()) / 60_000;
  kiemTra(/^\d{6}$/.test(lan1.maCode) && otp1.maCode === lan1.maCode && !otp1.daSuDung && phut > 4.9 && phut <= 5, `OTP 6 số, lưu MaOTP, hết hạn sau 5 phút (${phut.toFixed(2)})`);

  console.log("2. Gửi lại mã → mã cũ vô hiệu");
  const lan2 = await matKhauService.yeuCauOTP(SDT);
  kiemTra((await prisma.maOTP.findUniqueOrThrow({ where: { maOTP: otp1.maOTP } })).daSuDung && (await otpChuaDung(an.maTK)) === 1, "OTP cũ bị đánh dấu đã dùng, chỉ còn 1 mã hiệu lực");
  if (lan2.maCode !== lan1.maCode) await phaiLoi(() => matKhauService.xacNhanOTP(SDT, lan1.maCode), "maCode", "không chính xác");
  else kiemTra(true, "(mã mới trùng mã cũ do ngẫu nhiên – bỏ qua kiểm tra mã cũ)");

  console.log("3. OTP sai / đúng / hết hạn");
  await phaiLoi(() => matKhauService.xacNhanOTP(SDT, maSai(lan2.maCode)), "maCode", "không chính xác");
  await matKhauService.xacNhanOTP(SDT, lan2.maCode);
  kiemTra(true, "OTP đúng được xác nhận");
  await prisma.maOTP.updateMany({ where: { maTK: an.maTK, daSuDung: false }, data: { thoiGianHetHan: new Date(Date.now() - 60_000) } });
  await phaiLoi(() => matKhauService.xacNhanOTP(SDT, lan2.maCode), "maCode", "hết hạn");
  await phaiLoi(() => matKhauService.datLaiMatKhau(SDT, lan2.maCode, "moi123456", "moi123456"), "maCode", "hết hạn");
  kiemTra((await authService.dangNhap(SDT, "123456")).ok, "OTP hết hạn → mật khẩu cũ không đổi");

  console.log(`4. Nhập sai ${SO_LAN_SAI_TOI_DA} lần → mã bị hủy`);
  const lan3 = await matKhauService.yeuCauOTP(SDT);
  for (let i = 1; i < SO_LAN_SAI_TOI_DA; i++) await matKhauService.xacNhanOTP(SDT, maSai(lan3.maCode)).catch(() => {});
  await phaiLoi(() => matKhauService.xacNhanOTP(SDT, maSai(lan3.maCode)), "maCode", "bị hủy");
  await phaiLoi(() => matKhauService.xacNhanOTP(SDT, lan3.maCode), "maCode", "gửi lại mã");

  console.log("5. Đặt lại mật khẩu");
  const lan4 = await matKhauService.yeuCauOTP(SDT);
  await phaiLoi(() => matKhauService.datLaiMatKhau(SDT, lan4.maCode, "123", "123"), "matKhauMoi", "tối thiểu 6");
  await phaiLoi(() => matKhauService.datLaiMatKhau(SDT, lan4.maCode, "moi123456", "khac"), "nhapLai", "không khớp");
  await phaiLoi(() => matKhauService.datLaiMatKhau(SDT, maSai(lan4.maCode), "moi123456", "moi123456"), "maCode", "không chính xác");
  await matKhauService.datLaiMatKhau(SDT, lan4.maCode, "moi123456", "moi123456");
  kiemTra((await authService.dangNhap(SDT, "moi123456")).ok && !(await authService.dangNhap(SDT, "123456")).ok, "đăng nhập được bằng mật khẩu mới, mật khẩu cũ hết dùng");
  kiemTra((await otpChuaDung(an.maTK)) === 0, "OTP đã dùng được đánh dấu daSuDung");

  console.log("6. Dùng lại OTP lần 2");
  await phaiLoi(() => matKhauService.datLaiMatKhau(SDT, lan4.maCode, "khac12345", "khac12345"), null, "gửi lại mã");
  kiemTra((await authService.dangNhap(SDT, "moi123456")).ok, "mật khẩu không bị đổi lần 2");

  console.log("7. Nhật ký");
  const nk = await prisma.nhatKyHeThong.groupBy({ by: ["hanhDong"], where: { maTK: an.maTK, module: "TAI_KHOAN" }, _count: true });
  const dem = (h: string) => nk.find((x) => x.hanhDong === h)?._count ?? 0;
  kiemTra(dem("YEU_CAU_OTP") === 4 && dem("OTP_SAI") >= SO_LAN_SAI_TOI_DA + 1 && dem("DAT_LAI_MAT_KHAU_OTP") === 1,
    `YEU_CAU_OTP ${dem("YEU_CAU_OTP")}, OTP_SAI ${dem("OTP_SAI")}, DAT_LAI_MAT_KHAU_OTP ${dem("DAT_LAI_MAT_KHAU_OTP")}`);

  console.log(loi ? `\n✘ ${loi} kiểm tra thất bại` : "\n✔ Tất cả kiểm tra đạt");
  process.exitCode = loi ? 1 : 0;
}
main().finally(() => prisma.$disconnect());
