// Kiểm thử nghiệp vụ Khách hàng + hạng thành viên trên DB thật. Chạy: npm run test:khach-hang (chạy xong tự seed lại)
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { LoiNghiepVu } from "../lib/loi";
import { khachHangService } from "../lib/services/khachHangService";
import { posService } from "../lib/services/posService";

let loi = 0;
const kiemTra = (dk: boolean, moTa: string) => { console.log(dk ? "  ✔" : "  ✘", moTa); if (!dk) loi++; };
async function phaiLoi(fn: () => Promise<unknown>, truong: string | null, chua: string) {
  try { await fn(); kiemTra(false, `phải báo lỗi "${chua}"`); }
  catch (e) {
    const msg = e instanceof LoiNghiepVu ? (truong ? e.loiTruong?.[truong] : e.message) ?? "" : String(e);
    kiemTra(e instanceof LoiNghiepVu && msg.includes(chua), `báo lỗi${truong ? ` ô ${truong}` : ""}: ${msg}`);
  }
}
const kh = (sdt: string) => prisma.khachHang.findUniqueOrThrow({ where: { soDienThoai: sdt }, include: { hangThanhVien: true } });
const hang = (ten: string) => prisma.hangThanhVien.findUniqueOrThrow({ where: { tenHang: ten } });

async function main() {
  const admin = 1, staff = 2;

  console.log("1. Thêm khách hàng");
  await phaiLoi(() => khachHangService.taoMoi({ soDienThoai: "123", hoTen: "A", email: "sai" }, staff), "email", "không hợp lệ");
  await phaiLoi(() => khachHangService.taoMoi({ soDienThoai: "123", hoTen: "A" }, staff), "hoTen", "Nhập họ tên");
  await phaiLoi(() => khachHangService.taoMoi({ soDienThoai: "0911111111", hoTen: "Ai đó" }, staff), "soDienThoai", "Trần Thị Mai");
  const moi = await khachHangService.taoMoi({ soDienThoai: "0981 234 567", hoTen: "  Vũ   Tiến Thịnh ", email: "thinh@gmail.com", diaChi: "" }, staff);
  kiemTra(moi.soDienThoai === "0981234567" && moi.hoTen === "Vũ Tiến Thịnh" && moi.diaChi === null, "chuẩn hóa SĐT, họ tên, địa chỉ trống → null");
  kiemTra(moi.diemHienTai === 0 && moi.maHang === (await hang("Đồng")).maHang, "0 điểm, hạng Đồng");
  await phaiLoi(() => posService.taoNhanhKhachHang(staff, "0981234567", "Trùng"), null, "đã được đăng ký");

  console.log("2. Sửa / xóa");
  await phaiLoi(() => khachHangService.capNhat(moi.maKH, { soDienThoai: "0922222222", hoTen: "Vũ Tiến Thịnh" }, staff), "soDienThoai", "Phạm Văn Nam");
  await khachHangService.capNhat(moi.maKH, { soDienThoai: "0987654321", hoTen: "Vũ Tiến Thịnh", email: "", diaChi: "Quận 7" }, staff);
  const sua = await prisma.khachHang.findUniqueOrThrow({ where: { maKH: moi.maKH } });
  kiemTra(sua.soDienThoai === "0987654321" && sua.email === null && sua.diaChi === "Quận 7", "sửa SĐT, xóa email, thêm địa chỉ");
  const nk = await prisma.nhatKyHeThong.findFirstOrThrow({ where: { module: "KHACH_HANG", hanhDong: "SUA" }, orderBy: { maLog: "desc" } });
  kiemTra(!!nk.noiDung?.includes("0981234567 → 0987654321"), `nhật ký đổi SĐT: ${nk.noiDung}`);
  const ha = await kh("0933333333");
  await phaiLoi(() => khachHangService.xoa(ha.maKH, admin), null, "đã có 1 hóa đơn");
  await khachHangService.xoa(moi.maKH, admin);
  kiemTra(!(await prisma.khachHang.findUnique({ where: { maKH: moi.maKH } })), "xóa khách chưa có hóa đơn");

  console.log("3. Tra cứu / thống kê");
  kiemTra((await khachHangService.danhSach({ tuKhoa: "0933" }, 1)).khachs[0]?.maKH === ha.maKH, "tìm theo SĐT");
  kiemTra((await khachHangService.danhSach({ tuKhoa: "thu hà" }, 1)).tong === 1, "tìm theo tên (không phân biệt hoa thường)");
  const vang = await khachHangService.danhSach({ maHang: (await hang("Vàng")).maHang }, 1);
  kiemTra(vang.khachs.every((k) => k.hangThanhVien.tenHang === "Vàng") && vang.tong >= 1, `lọc hạng Vàng: ${vang.tong}`);
  const theoDiem = (await khachHangService.danhSach({ sapXep: "diem" }, 1)).khachs;
  kiemTra(theoDiem.every((k, i) => i === 0 || theoDiem[i - 1].diemTichLuy >= k.diemTichLuy), "sắp xếp theo điểm tích lũy giảm dần");
  const ctHa = (await khachHangService.layChiTiet(ha.maKH))!;
  kiemTra(ctHa.soHoaDon === 1 && ctHa.tongChiTieu === 283500 && ctHa.hoaDons.length === 1, `Hà: 1 HĐ, chi tiêu ${ctHa.tongChiTieu}`);
  const mai = await kh("0911111111");
  const ctMai = (await khachHangService.layChiTiet(mai.maKH))!;
  kiemTra(ctMai.hangKeTiep?.tenHang === "Bạc" && ctMai.hangKeTiep.diemToiThieu - mai.diemTichLuy === 180, "Mai còn 180 điểm lên Bạc");

  console.log("4. Hạng thành viên");
  const bac = await hang("Bạc");
  const f = (tenHang: string, diemToiThieu: string, phanTramUuDai: string) => ({ tenHang, diemToiThieu, phanTramUuDai });
  await phaiLoi(() => khachHangService.luuHang(null, f("vàng", "3000", "12"), admin), "tenHang", "đã tồn tại");
  await phaiLoi(() => khachHangService.luuHang(null, f("Kim cương", "2000", "12"), admin), "diemToiThieu", "cùng mốc");
  await phaiLoi(() => khachHangService.luuHang(null, f("Kim cương", "5000", "60"), admin), "phanTramUuDai", "0 đến 50");
  await phaiLoi(async () => khachHangService.luuHang((await hang("Đồng")).maHang, f("Đồng", "100", "0"), admin), null, "mốc 0 điểm");
  const soDoi1 = await khachHangService.luuHang(bac.maHang, f("Bạc", "300", "5"), admin);
  kiemTra((await kh(mai.soDienThoai)).hangThanhVien.tenHang === "Bạc" && soDoi1 >= 1, `hạ mốc Bạc 500 → 300: Mai (320) lên Bạc, ${soDoi1} khách đổi hạng`);
  await khachHangService.luuHang(null, f("Kim cương", "2500", "15"), admin);
  kiemTra((await kh(ha.soDienThoai)).hangThanhVien.tenHang === "Kim cương", "thêm Kim cương (2500): Hà (2600) lên hạng");
  await posService.themSach(staff, (await prisma.sach.findUniqueOrThrow({ where: { isbn: "9786042000013" } })).maSach, 1);
  await posService.chonKhachHang(staff, ha.soDienThoai);
  const gio = await posService.layGioHang(staff);
  kiemTra(gio.tien?.giamHang === Math.round(88000 * 0.15), `POS áp ưu đãi hạng mới 15%: −${gio.tien?.giamHang}`);
  await posService.huyDon(staff);
  await phaiLoi(async () => khachHangService.xoaHang((await hang("Đồng")).maHang, admin), null, "mốc 0 điểm");
  await khachHangService.xoaHang((await hang("Kim cương")).maHang, admin);
  kiemTra((await kh(ha.soDienThoai)).hangThanhVien.tenHang === "Vàng" && !(await prisma.hangThanhVien.findUnique({ where: { tenHang: "Kim cương" } })),
    "xóa Kim cương: Hà về Vàng");
  const nkHang = await prisma.nhatKyHeThong.count({ where: { module: "HANG_THANH_VIEN" } });
  kiemTra(nkHang === 3, `nhật ký HANG_THANH_VIEN: ${nkHang} (SUA, THEM, XOA)`);

  console.log(loi ? `\n✘ ${loi} kiểm tra thất bại` : "\n✔ Tất cả kiểm tra đạt");
  process.exitCode = loi ? 1 : 0;
}
main().finally(() => prisma.$disconnect());
