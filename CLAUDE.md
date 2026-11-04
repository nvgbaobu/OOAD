# Phần mềm Quản lý cửa hàng bán sách – Nhóm 09 (OOAD, ĐH Sài Gòn)

Bàn giao từ phiên chat claude.ai (04/11/2026). File này là nguồn sự thật cho mọi phiên Claude Code – cập nhật khi có quyết định mới.

@AGENTS.md

## Bối cảnh
- Đồ án môn Phân tích thiết kế hướng đối tượng. GVHD: ThS. Hoàng Mạnh Hà.
- Thành viên: Vũ Tiến Thịnh, Lê Hoàng An, Nguyễn Võ Gia Bảo, Quách Tuấn Hào, Nguyễn Trung Hiếu, Tạ Ngọc Khánh Huy.
- Mục tiêu hiện tại: làm **bản demo đơn giản, đủ chức năng** (không cần UI đẹp), rồi chụp màn hình cho mục 3.1.7 Mô tả giao diện trong báo cáo.
- Hệ thống bán hàng **offline tại quầy (POS)**, chạy nội bộ. Chỉ 2 vai trò: **Admin** và **Staff**.

## Tech stack (đã chốt)
- Next.js (App Router) + **TypeScript**, Tailwind (mặc định, tối giản).
- **SQL Server 2025** chạy bằng Docker (`mcr.microsoft.com/mssql/server:2025-latest`, user `sa`, port 1433).
- **Prisma ORM** (provider `sqlserver`). Đăng nhập tự viết: session cookie + `bcrypt`. Xuất Excel: `exceljs`.
- Máy dev: Ubuntu. IDE: WebStorm + DataGrip.
- Kiến trúc 3 lớp (khớp báo cáo): `app/` = giao diện, `lib/services/` = nghiệp vụ (BUS), `lib/repositories/` = truy vấn (DAO), model Prisma = lớp thực thể.

## Lược đồ CSDL (21 bảng) – tên bảng/cột tiếng Việt không dấu
Kiểu SQL Server: ENUM → NVARCHAR + CHECK; BOOLEAN → BIT; DATETIME → DATETIME2; chuỗi tiếng Việt dùng NVARCHAR; tiền dùng DECIMAL(12,2).

1. TaiKhoan(maTK PK, soDienThoai UQ, matKhauHash, hoTen, email, vaiTro ADMIN|STAFF, trangThai HOAT_DONG|KHOA, ngayTao)
2. MaOTP(maOTP PK, maTK FK, maCode, thoiGianHetHan, daSuDung)
3. TheLoai(maTL PK, tenTL UQ)
4. Sach(maSach PK, isbn UQ, tenSach, tacGia, nhaXuatBan, namXB, maTL FK, giaNhap, giaBan, hinhAnh, viTriKe, soLuongTon, soLuongTamGiu, dinhMucToiThieu=5, trangThai DANG_BAN|NGUNG_KINH_DOANH)
5. HangThanhVien(maHang PK, tenHang UQ, diemToiThieu, phanTramUuDai)
6. KhachHang(maKH PK, soDienThoai UQ, hoTen, email, diaChi, diemHienTai, diemTichLuy, maHang FK, ngayTao)
7. MaGiamGia(maMGG PK, maCode UQ, loaiGiam PHAN_TRAM|SO_TIEN, giaTriGiam, giaTriDonToiThieu, soLuongToiDa, daSuDung, ngayBatDau, ngayKetThuc, trangThai)
8. Combo(maCombo PK, tenCombo, giaCombo, ngayBatDau, ngayKetThuc, trangThai)
9. ChiTietCombo(maCombo PK/FK, maSach PK/FK, soLuong)
10. HoaDon(maHD PK, maTK FK, maKH FK null, maMGG FK null, thoiGianTao, trangThai DANG_LAP|DA_THANH_TOAN|DA_HUY, tamTinh, thueVAT, tienGiam, diemSuDung, tongTien, phuongThucTT TIEN_MAT|QUET_THE|MA_QR, tienKhachDua, lyDoHuy)
11. ChiTietHoaDon(maHD PK/FK, maSach PK/FK, soLuong, donGiaBan [snapshot giá lúc bán], thanhTien)
12. NhaCungCap(maNCC PK, tenNCC, diaChi, maSoThue UQ, nguoiLienHe, soDienThoai, trangThaiHopTac DANG_GIAO_DICH|NGUNG_GIAO_DICH)
13. PhieuNhap(maPN PK, maNCC FK, maTKLap FK, maTKDuyet FK null, ngayLap, ngayDuyet, trangThai CHO_DUYET|DA_DUYET|TU_CHOI, tongTien, ghiChu, lyDoTuChoi)
14. ChiTietPhieuNhap(maPN PK/FK, maSach PK/FK, soLuong, giaNhap)
15. PhieuKiemKe(maPKK PK, maTKLap FK, maTKDuyet FK null, ngayLap, ngayDuyet, trangThai, ghiChu, lyDoTuChoi)
16. ChiTietKiemKe(maPKK PK/FK, maSach PK/FK, slHeThong, slThucTe, lyDoChenhLech)
17. PhieuXuatHuy(maPXH PK, các cột như PhieuKiemKe)
18. ChiTietXuatHuy(maPXH PK/FK, maSach PK/FK, soLuong, lyDo)
19. CauHinhHeThong(maCH PK – 1 dòng, tenCuaHang, diaChi, soDienThoai, logo, maSoThue, tyLeQuyDoiDiem, giaTriMotDiem, ttTienMat, ttQuetThe, ttMaQR)
20. NhatKyHeThong(maLog PK bigint, maTK FK, thoiGian, module, hanhDong, noiDung)
21. BanSaoLuu(maBackup PK, maTK FK, thoiGian, duongDanFile, kichThuoc)

## Quy tắc nghiệp vụ quan trọng
- Thêm sách vào đơn đang lập → tăng `soLuongTamGiu`; thanh toán → trừ `soLuongTon` và giải phóng tạm giữ; hủy đơn nháp → giải phóng tạm giữ. Số bán được = soLuongTon − soLuongTamGiu.
- Phiếu nhập / kiểm kê / xuất hủy: Staff lập (CHO_DUYET) → Admin duyệt (cộng/trừ kho) hoặc từ chối (kho không đổi).
- Thanh toán: áp mã giảm giá (kiểm tra hạn, lượt dùng, đơn tối thiểu), ưu đãi theo hạng thẻ, đổi điểm; cộng điểm theo tyLeQuyDoiDiem; xét thăng hạng theo diemTichLuy.
- Hủy hóa đơn đã thanh toán (chỉ Admin, bắt buộc lý do): hoàn kho, trừ điểm khách.
- Sách "Ngừng kinh doanh" ẩn khỏi POS, giữ dữ liệu cho hóa đơn cũ. Giá bán ≥ giá nhập.
- Mọi thao tác quan trọng ghi NhatKyHeThong.

## Phạm vi demo (~10 màn hình)
1. Đăng nhập (phân quyền Admin → Dashboard, Staff → POS)
2. POS bán hàng: thêm sách, nhập SĐT khách, áp mã, thanh toán, xem bill
3. Quản lý sách  4. Tồn kho + lập/duyệt phiếu kiểm kê, xuất hủy
5. Nhà cung cấp + phiếu nhập  6. Hóa đơn (tra cứu, chi tiết, hủy)
7. Khách hàng + tích điểm  8. Mã giảm giá
9. Dashboard + báo cáo doanh thu, xuất Excel  10. Cài đặt + quản lý tài khoản

## Quy trình làm việc với Claude Code (BẮT BUỘC)
- **Mỗi phiên chỉ làm 1 module** (vd: "làm màn hình POS"). Không làm nhiều màn hình cùng lúc.
- **Commit sau mỗi chức năng chạy được** (đã kiểm tra `npx tsc --noEmit`, `npm run lint`, chạy thử) – để dễ quay lại phiên bản trước. Message commit tiếng Việt, dạng `feat(<module>): ...`, `fix(...)`, `chore(...)`.
- **Khi có quyết định mới** (đổi bảng/cột, thêm quy tắc nghiệp vụ, chốt thư viện) → cập nhật CLAUDE.md ngay trong cùng commit (mục "Quyết định đã chốt" hoặc mục liên quan).
- Đổi schema: sửa `prisma/schema.prisma` → `npx prisma migrate dev --name <ten>` (nếu cần CHECK thì `--create-only`, thêm CHECK vào SQL rồi chạy lại `migrate dev`) → `npx prisma generate` → cập nhật seed nếu cần.

## Cài đặt & chạy
```bash
cp .env.example .env              # mật khẩu sa mặc định: QlbsSach@2026
docker compose up -d              # container qlbs-mssql, port 1433, volume mssql_data
npm install
npx prisma migrate deploy         # tạo DB QuanLyBanSach + 21 bảng + CHECK
npx prisma generate               # sinh client vào lib/generated/prisma (gitignored)
npx prisma db seed                # dữ liệu mẫu (idempotent: xóa sạch rồi chèn lại)
npm run dev
```
- Tài khoản mẫu (mật khẩu `123456`): Admin `0900000001`; Staff `0900000002`, `0900000003`.
- Xem DB bằng DataGrip: localhost:1433, user `sa`, DB `QuanLyBanSach`, bật trust server certificate.

## Quyết định đã chốt (cập nhật dần)
- 04/11/2026 – **Prisma 7.10.1** (bản stable; tag `latest` trên npm đang là 8.0.0-rc → không dùng). Prisma 7 dùng `prisma.config.ts` (URL migrate lấy từ `DATABASE_URL`) và **driver adapter** `@prisma/adapter-mssql` lúc chạy (đọc `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD`). Generator `prisma-client`, import từ `@/lib/generated/prisma/client`. Dùng chung client qua `lib/prisma.ts`.
- 04/11/2026 – Next.js 16.4.5, React 19, Tailwind 4. Next 16 có thay đổi lớn → đọc `node_modules/next/dist/docs/` trước khi viết code Next (xem AGENTS.md).
- 04/11/2026 – Hash mật khẩu dùng **`bcryptjs`** (thuần JS, cùng định dạng hash bcrypt, không cần build native).
- 04/11/2026 – Tên model Prisma = tên bảng (PascalCase tiếng Việt, `@@map` giữ đúng tên bảng); client dùng camelCase: `prisma.taiKhoan`, `prisma.hoaDon`...
- 04/11/2026 – Khóa chính dạng INT IDENTITY (riêng `NhatKyHeThong.maLog` BIGINT). Bảng chi tiết dùng khóa ghép, xóa phiếu/hóa đơn cha thì xóa chi tiết (CASCADE); các FK khác NO ACTION.
- 04/11/2026 – Giá trị trạng thái chưa nêu trong lược đồ gốc: `MaGiamGia.trangThai`, `Combo.trangThai` = `HOAT_DONG | NGUNG_HOAT_DONG`.
- 04/11/2026 – CHECK constraint trong migration `init`: các "enum", `giaBan >= giaNhap`, `0 <= soLuongTamGiu <= soLuongTon`, điểm ≥ 0, mã giảm giá `daSuDung <= soLuongToiDa`, `%` ≤ 100, `CauHinhHeThong.maCH = 1` (1 dòng).
- 04/11/2026 – `KhachHang.maHang` bắt buộc (khách mới gán hạng có `diemToiThieu` thấp nhất). `NhatKyHeThong.maTK` cho phép NULL (vd: đăng nhập thất bại). `HoaDon.phuongThucTT` NULL khi đang lập.
- 04/11/2026 – `HoaDon.thueVAT`, `tienGiam` lưu **số tiền**. `CauHinhHeThong.tyLeQuyDoiDiem` = số tiền chi tiêu để được 1 điểm (mặc định 10.000đ); `giaTriMotDiem` = giá trị 1 điểm khi đổi (mặc định 1.000đ).

## Câu hỏi còn mở (cần nhóm chốt)
- Thuế suất VAT áp cho hóa đơn là bao nhiêu? (chưa có cột tỷ lệ trong CauHinhHeThong; seed đang để thueVAT = 0).
- Thứ tự áp giảm giá khi thanh toán: ưu đãi hạng → mã giảm giá → đổi điểm? Tính VAT trước hay sau giảm?

## Tiến độ
- [x] Khởi tạo Next.js + Prisma, `schema.prisma` 21 bảng, migrate lên SQL Server Docker, seed dữ liệu mẫu (04/11/2026).
- [ ] Đăng nhập (phân quyền Admin → Dashboard, Staff → POS)
- [ ] POS bán hàng
- [ ] Các module còn lại (3–10), mỗi module 1 branch `feature/<module>`.

## Lưu ý cho báo cáo (đã xử lý ở bản Lan04 track changes)
- Thống nhất trạng thái phiếu "Đã duyệt" (UC7.3 đang ghi "Hoàn tất").
- Hình đánh số tiếp từ Hình 3.59 (lược đồ CSDL).