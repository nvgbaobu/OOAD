// Nghiệp vụ đăng nhập (BUS)
import bcrypt from "bcryptjs";
import { taiKhoanRepository } from "@/lib/repositories/taiKhoanRepository";
import { nhatKyRepository } from "@/lib/repositories/nhatKyRepository";
import type { VaiTro } from "@/lib/auth/token";

// Hash giả để so sánh khi SĐT không tồn tại → thời gian phản hồi như nhau (không lộ SĐT nào có tài khoản)
const HASH_GIA = bcrypt.hashSync("khong-co-tai-khoan", 10);

export type KetQuaDangNhap =
  | { ok: true; maTK: number; vaiTro: VaiTro }
  | { ok: false; loi: string };

export const authService = {
  async dangNhap(soDienThoai: string, matKhau: string): Promise<KetQuaDangNhap> {
    const tk = await taiKhoanRepository.timTheoSoDienThoai(soDienThoai);
    const dungMatKhau = await bcrypt.compare(matKhau, tk?.matKhauHash ?? HASH_GIA);

    if (!tk || !dungMatKhau) {
      await nhatKyRepository.ghi({
        maTK: tk?.maTK, module: "TAI_KHOAN", hanhDong: "DANG_NHAP_THAT_BAI", noiDung: `SĐT: ${soDienThoai}`,
      });
      return { ok: false, loi: "Số điện thoại hoặc mật khẩu không đúng" };
    }
    if (tk.trangThai !== "HOAT_DONG") {
      await nhatKyRepository.ghi({ maTK: tk.maTK, module: "TAI_KHOAN", hanhDong: "DANG_NHAP_BI_KHOA" });
      return { ok: false, loi: "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên" };
    }

    await nhatKyRepository.ghi({ maTK: tk.maTK, module: "TAI_KHOAN", hanhDong: "DANG_NHAP" });
    return { ok: true, maTK: tk.maTK, vaiTro: tk.vaiTro as VaiTro };
  },

  async dangXuat(maTK: number) {
    await nhatKyRepository.ghi({ maTK, module: "TAI_KHOAN", hanhDong: "DANG_XUAT" });
  },
};
