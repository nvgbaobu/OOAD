// Nghiệp vụ đăng nhập (BUS)
import bcrypt from "bcryptjs";
import { TaiKhoan } from "@/lib/entities/TaiKhoan";
import type { VaiTro } from "@/lib/auth/token";
import { NhatKyHeThong } from "@/lib/entities/NhatKyHeThong";

// Hash giả để so sánh khi SĐT không tồn tại → thời gian phản hồi như nhau (không lộ SĐT nào có tài khoản)
const HASH_GIA = bcrypt.hashSync("khong-co-tai-khoan", 10);

export type KetQuaDangNhap =
  | { ok: true; maTK: number; vaiTro: VaiTro }
  | { ok: false; loi: string };

export const authService = {
  async dangNhap(soDienThoai: string, matKhau: string): Promise<KetQuaDangNhap> {
    const tk = await TaiKhoan.timTheoSDT(soDienThoai);
    // SĐT không tồn tại vẫn so với hash giả → thời gian phản hồi như nhau
    const dungMatKhau = tk ? await tk.kiemTraMatKhau(matKhau) : await bcrypt.compare(matKhau, HASH_GIA);

    if (!tk || !dungMatKhau) {
      await NhatKyHeThong.ghiNhatKy({
        maTK: tk?.maTK, module: "TAI_KHOAN", hanhDong: "DANG_NHAP_THAT_BAI", noiDung: `SĐT: ${soDienThoai}`,
      });
      return { ok: false, loi: "Số điện thoại hoặc mật khẩu không chính xác" };
    }
    if (tk.trangThai !== "HOAT_DONG") {
      await NhatKyHeThong.ghiNhatKy({ maTK: tk.maTK, module: "TAI_KHOAN", hanhDong: "DANG_NHAP_BI_KHOA" });
      return { ok: false, loi: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên" };
    }

    await NhatKyHeThong.ghiNhatKy({ maTK: tk.maTK, module: "TAI_KHOAN", hanhDong: "DANG_NHAP" });
    return { ok: true, maTK: tk.maTK, vaiTro: tk.vaiTro as VaiTro };
  },

  async dangXuat(maTK: number) {
    await NhatKyHeThong.ghiNhatKy({ maTK, module: "TAI_KHOAN", hanhDong: "DANG_XUAT" });
  },
};
