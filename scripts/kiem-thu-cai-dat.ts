// Kiểm thử Cài đặt + tài khoản + nhật ký + sao lưu trên DB thật. Chạy: npm run test:cai-dat (chạy xong tự seed lại)
import "dotenv/config";
import { execFileSync } from "node:child_process";
import { prisma } from "../lib/prisma";
import { LoiNghiepVu } from "../lib/loi";
import { caiDatService, type FormCauHinh } from "../lib/services/caiDatService";
import { taiKhoanService } from "../lib/services/taiKhoanService";
import { authService } from "../lib/services/authService";
import { posService, LY_DO_HUY } from "../lib/services/posService";

let loi = 0;
const kiemTra = (dk: boolean, moTa: string) => { console.log(dk ? "  ✔" : "  ✘", moTa); if (!dk) loi++; };
async function phaiLoi(fn: () => Promise<unknown>, truong: string | null, chua: string) {
  try { await fn(); kiemTra(false, `phải báo lỗi "${chua}"`); }
  catch (e) {
    const msg = e instanceof LoiNghiepVu ? (truong ? e.loiTruong?.[truong] : e.message) ?? "" : String(e);
    kiemTra(e instanceof LoiNghiepVu && msg.includes(chua), `báo lỗi${truong ? ` ô ${truong}` : ""}: ${msg}`);
  }
}
const sach = (isbn: string) => prisma.sach.findUniqueOrThrow({ where: { isbn } });

async function main() {
  const admin = 1, an = 2;

  console.log("1. Cấu hình cửa hàng / tích điểm / thanh toán");
  const ch = await caiDatService.layCauHinh();
  const f: FormCauHinh = {
    tenCuaHang: ch.tenCuaHang, diaChi: ch.diaChi ?? "", soDienThoai: ch.soDienThoai ?? "", maSoThue: ch.maSoThue ?? "", logo: "",
    tyLeQuyDoiDiem: "10000", giaTriMotDiem: "1000", ttTienMat: true, ttQuetThe: true, ttMaQR: true,
  };
  await phaiLoi(() => caiDatService.luuCauHinh({ ...f, tenCuaHang: " " }, admin), "tenCuaHang", "Nhập tên");
  await phaiLoi(() => caiDatService.luuCauHinh({ ...f, giaTriMotDiem: "10000" }, admin), "giaTriMotDiem", "nhỏ hơn");
  await phaiLoi(() => caiDatService.luuCauHinh({ ...f, ttTienMat: false, ttQuetThe: false, ttMaQR: false }, admin), "phuongThuc", "ít nhất 1");
  await phaiLoi(() => caiDatService.luuCauHinh({ ...f, maSoThue: "123", logo: "logo.png" }, admin), "logo", "http");
  await caiDatService.luuCauHinh({ ...f, tyLeQuyDoiDiem: "20.000", ttQuetThe: false }, admin);
  const moi = await caiDatService.layCauHinh();
  kiemTra(Number(moi.tyLeQuyDoiDiem) === 20000 && !moi.ttQuetThe, "lưu: 20.000đ/điểm, tắt quẹt thẻ");
  const nkCH = await prisma.nhatKyHeThong.findFirstOrThrow({ where: { module: "CAI_DAT", hanhDong: "SUA" }, orderBy: { maLog: "desc" } });
  kiemTra(!!nkCH.noiDung?.includes("tyLeQuyDoiDiem: 10000 → 20000") && nkCH.noiDung.includes("ttQuetThe: true → false"), `nhật ký: ${nkCH.noiDung}`);
  const rungNaUy = await sach("9786042000007");
  await posService.themSach(an, rungNaUy.maSach, 2);
  await posService.chonKhachHang(an, "0911111111");
  const gio = await posService.layGioHang(an);
  kiemTra(!gio.phuongThuc.includes("QUET_THE") && gio.tien?.diemCong === Math.floor((gio.tien?.tongTien ?? 0) / 20000), `POS: ẩn quẹt thẻ, điểm cộng theo tỷ lệ mới (${gio.tien?.diemCong})`);
  await phaiLoi(() => posService.thanhToan(an, "QUET_THE", null), null, "không được bật");
  await posService.huyDon(an);

  console.log("2. Thêm / sửa tài khoản");
  const tk = { soDienThoai: "0912 345 678", hoTen: "  Nguyễn  Trung Hiếu ", email: "hieu@nhasach09.vn", vaiTro: "STAFF", matKhau: "hieu2026" };
  await phaiLoi(() => taiKhoanService.tao({ ...tk, soDienThoai: "0900000002" }, admin), "soDienThoai", "đã có tài khoản");
  await phaiLoi(() => taiKhoanService.tao({ ...tk, matKhau: "123" }, admin), "matKhau", "tối thiểu 6");
  await phaiLoi(() => taiKhoanService.tao({ ...tk, vaiTro: "KHACH" }, admin), "vaiTro", "Chọn vai trò");
  const hieu = await taiKhoanService.tao(tk, admin);
  kiemTra(hieu.soDienThoai === "0912345678" && hieu.hoTen === "Nguyễn Trung Hiếu" && !("matKhauHash" in hieu), "tạo tài khoản (chuẩn hóa, không trả hash)");
  const dn = await authService.dangNhap("0912345678", "hieu2026");
  kiemTra(dn.ok && dn.vaiTro === "STAFF", "đăng nhập bằng tài khoản mới");
  await taiKhoanService.capNhat(hieu.maTK, { ...tk, vaiTro: "ADMIN" }, admin);
  kiemTra((await taiKhoanService.layChiTiet(hieu.maTK))?.vaiTro === "ADMIN", "nâng lên Admin");

  console.log("3. Quy tắc Admin");
  await phaiLoi(() => taiKhoanService.capNhat(admin, { ...tk, hoTen: "Gia Bảo", vaiTro: "STAFF" }, admin), "vaiTro", "Không tự hạ quyền");
  await phaiLoi(() => taiKhoanService.doiTrangThai(admin, true, admin), null, "Không tự khóa");
  await taiKhoanService.doiTrangThai(admin, true, hieu.maTK); // còn Hiếu là Admin → khóa được
  kiemTra((await authService.dangNhap("0900000001", "123456")).ok === false, "Admin bị khóa không đăng nhập được");
  await phaiLoi(() => taiKhoanService.capNhat(hieu.maTK, { ...tk, vaiTro: "STAFF" }, an), "vaiTro", "ít nhất 1 Admin");
  await phaiLoi(() => taiKhoanService.doiTrangThai(hieu.maTK, true, an), null, "ít nhất 1 Admin");
  await taiKhoanService.doiTrangThai(admin, false, hieu.maTK);
  kiemTra((await authService.dangNhap("0900000001", "123456")).ok, "mở khóa → đăng nhập lại được");

  console.log("4. Khóa nhân viên đang có đơn ở quầy");
  await posService.themSach(an, rungNaUy.maSach, 3);
  kiemTra((await sach(rungNaUy.isbn)).soLuongTamGiu === 3, "nhân viên An đang giữ 3 cuốn");
  await taiKhoanService.doiTrangThai(an, true, admin);
  const don = await prisma.hoaDon.findFirstOrThrow({ where: { maTK: an }, orderBy: { maHD: "desc" } });
  kiemTra(don.trangThai === "DA_HUY" && don.lyDoHuy === LY_DO_HUY.KHOA_TAI_KHOAN && (await sach(rungNaUy.isbn)).soLuongTamGiu === 0,
    "khóa → hủy đơn đang lập, trả tạm giữ");
  const dnKhoa = await authService.dangNhap("0900000002", "123456");
  kiemTra(!dnKhoa.ok && dnKhoa.loi.includes("bị khóa"), "nhân viên bị khóa không đăng nhập được");
  await taiKhoanService.doiTrangThai(an, false, admin);

  console.log("5. Mật khẩu");
  await phaiLoi(() => taiKhoanService.datLaiMatKhau(an, "moi12345", "khac", admin), "nhapLai", "không khớp");
  await taiKhoanService.datLaiMatKhau(an, "moi12345", "moi12345", admin);
  kiemTra((await authService.dangNhap("0900000002", "moi12345")).ok && !(await authService.dangNhap("0900000002", "123456")).ok, "Admin đặt lại: mật khẩu mới dùng được, cũ thì không");
  await phaiLoi(() => taiKhoanService.doiMatKhau(an, "sai", "abc12345", "abc12345"), "matKhauCu", "không đúng");
  await phaiLoi(() => taiKhoanService.doiMatKhau(an, "moi12345", "moi12345", "moi12345"), "matKhauMoi", "phải khác");
  await taiKhoanService.doiMatKhau(an, "moi12345", "an@2026!", "an@2026!");
  kiemTra((await authService.dangNhap("0900000002", "an@2026!")).ok, "tự đổi mật khẩu thành công");

  console.log("6. Nhật ký");
  const nkTK = await caiDatService.nhatKy({ module: "TAI_KHOAN" }, 1);
  const hd = new Set(nkTK.dong.map((n) => n.hanhDong));
  kiemTra(["THEM", "SUA", "KHOA", "MO_KHOA", "DAT_LAI_MAT_KHAU", "DOI_MAT_KHAU", "DANG_NHAP", "DANG_NHAP_BI_KHOA"].every((h) => hd.has(h)), `nhật ký TAI_KHOAN đủ hành động (${nkTK.tong} dòng)`);
  kiemTra((await caiDatService.nhatKy({ tuKhoa: "Trung Hiếu" }, 1)).dong.every((n) => n.noiDung?.includes("Trung Hiếu")), "tìm theo nội dung");
  kiemTra((await caiDatService.cacModuleNhatKy()).includes("CAI_DAT"), "danh sách module có CAI_DAT");

  console.log("7. Sao lưu");
  const bs = await caiDatService.saoLuu(admin);
  kiemTra(Number(bs.kichThuoc) > 0 && /QuanLyBanSach_\d{8}_\d{6}\.bak$/.test(bs.duongDanFile), `tạo ${bs.duongDanFile} (${Number(bs.kichThuoc).toLocaleString("vi-VN")} byte)`);
  kiemTra((await caiDatService.danhSachSaoLuu())[0]?.maBackup === bs.maBackup, "ghi bảng BanSaoLuu");
  try {
    execFileSync("docker", ["exec", "qlbs-mssql", "rm", "-f", bs.duongDanFile]); // dọn file thử
  } catch { console.log("  (không xóa được file .bak thử – bỏ qua)"); }

  console.log(loi ? `\n✘ ${loi} kiểm tra thất bại` : "\n✔ Tất cả kiểm tra đạt");
  process.exitCode = loi ? 1 : 0;
}
main().finally(() => prisma.$disconnect());
