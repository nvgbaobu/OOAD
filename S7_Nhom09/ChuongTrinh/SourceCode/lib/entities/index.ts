// Lớp thực thể (Entity) – khớp sơ đồ lớp mục 3.1.5 của báo cáo (23 lớp, Bảng 3.37–3.82).
// Mỗi lớp khai báo THUỘC TÍNH (= cột trong prisma/schema.prisma; `implements <Model>` để TypeScript báo lỗi nếu lệch)
// và PHƯƠNG THỨC (gọi xuống lib/repositories – lớp thực thể không gọi Prisma trực tiếp).
// Kiến trúc: giao diện (app/) → server action (app/actions) → service (lib/services, điều phối nghiệp vụ + transaction)
//            → lớp thực thể (lib/entities) → repository (lib/repositories, truy vấn SQL Server).
// Lưu ý: chỉ dùng lớp thực thể bên trong service; dữ liệu trả lên giao diện là object thường
// (Next.js không cho truyền đối tượng có phương thức từ server sang client component).
export { TaiKhoan } from "./TaiKhoan";
export { MaOTP } from "./MaOTP";
export { TheLoai } from "./TheLoai";
export { Sach } from "./Sach";
export { HangThanhVien } from "./HangThanhVien";
export { KhachHang } from "./KhachHang";
export { HoaDon } from "./HoaDon";
export { ChiTietHoaDon } from "./ChiTietHoaDon";
export { KhuyenMai } from "./KhuyenMai";
export { MaGiamGia } from "./MaGiamGia";
export { Combo } from "./Combo";
export { ChiTietCombo } from "./ChiTietCombo";
export { NhaCungCap } from "./NhaCungCap";
export { PhieuKho } from "./PhieuKho";
export { PhieuNhap } from "./PhieuNhap";
export { PhieuKiemKe } from "./PhieuKiemKe";
export { PhieuXuatHuy } from "./PhieuXuatHuy";
export { ChiTietPhieuNhap, ChiTietKiemKe, ChiTietXuatHuy } from "./ChiTietPhieuKho";
export { CauHinhHeThong } from "./CauHinhHeThong";
export { NhatKyHeThong } from "./NhatKyHeThong";
export { BanSaoLuu } from "./BanSaoLuu";
