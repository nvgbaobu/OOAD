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
3. TheLoai(maTL PK, tenTL UQ, thueSuatVAT % [0 hoặc 5, mặc định 5])
4. Sach(maSach PK, isbn UQ, tenSach, tacGia, nhaXuatBan, namXB, maTL FK, giaNhap, giaBan, hinhAnh, viTriKe, soLuongTon, soLuongTamGiu, dinhMucToiThieu=5, trangThai DANG_BAN|NGUNG_KINH_DOANH)
5. HangThanhVien(maHang PK, tenHang UQ, diemToiThieu, phanTramUuDai)
6. KhachHang(maKH PK, soDienThoai UQ, hoTen, email, diaChi, diemHienTai, diemTichLuy, maHang FK, ngayTao)
7. MaGiamGia(maMGG PK, maCode UQ, loaiGiam PHAN_TRAM|SO_TIEN, giaTriGiam, giaTriDonToiThieu, soLuongToiDa, daSuDung, ngayBatDau, ngayKetThuc, trangThai)
8. Combo(maCombo PK, tenCombo, giaCombo, ngayBatDau, ngayKetThuc, trangThai)
9. ChiTietCombo(maCombo PK/FK, maSach PK/FK, soLuong)
10. HoaDon(maHD PK, maTK FK, maKH FK null, maMGG FK null, thoiGianTao, trangThai DANG_LAP|DA_THANH_TOAN|DA_HUY, tamTinh, thueVAT, tienGiam, diemSuDung, tongTien, phuongThucTT TIEN_MAT|QUET_THE|MA_QR, tienKhachDua, lyDoHuy)
11. ChiTietHoaDon(maHD PK/FK, maSach PK/FK, soLuong, donGiaBan [snapshot giá lúc bán], thanhTien, thueSuatVAT [snapshot thuế suất thể loại lúc bán])
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
- Thanh toán – **thứ tự áp ưu đãi: hạng thẻ → mã giảm giá → đổi điểm, VAT tính SAU giảm**. Cài đặt duy nhất ở `lib/services/tinhTienHoaDon.ts` (hàm thuần, POS và seed dùng chung – không tự tính lại ở chỗ khác):
  1. `giamHang` = tamTinh × phanTramUuDai của hạng.
  2. Mã giảm giá: kiểm tra hạn, lượt dùng (ở service) và đơn tối thiểu (xét trên số tiền **sau** ưu đãi hạng); PHAN_TRAM tính trên số tiền sau ưu đãi hạng.
  3. Đổi điểm: diemSuDung ≤ diemHienTai, giá trị = điểm × giaTriMotDiem, không vượt số tiền còn lại.
  4. VAT: tổng giảm phân bổ theo tỷ lệ thanhTien từng dòng, mỗi dòng nhân thuế suất của thể loại. tongTien = tiền sau giảm + VAT. Làm tròn đến đồng.
  - Cộng điểm = floor(tongTien / tyLeQuyDoiDiem) (chỉ khi có KH thành viên); xét thăng hạng theo diemTichLuy.
- **Thuế GTGT sách**: 0% (không chịu thuế) cho sách phục vụ chính trị, giáo dục, văn hóa (sách giáo khoa, giáo trình, chính trị – pháp luật, khoa học, lịch sử...); 5% cho sách còn lại (tham khảo, ngoại ngữ, truyện, kỹ năng sống...). Thuế suất gắn theo **thể loại** (`TheLoai.thueSuatVAT`) → khi thêm sách phải chọn đúng thể loại.
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

## Quy ước code (theo module Đăng nhập – các module sau làm theo)
- Cấu trúc: `lib/repositories/<ten>Repository.ts` (chỉ gọi Prisma) → `lib/services/<ten>Service.ts` (nghiệp vụ, ghi nhật ký) → `app/actions/<module>.ts` (`"use server"`, đọc FormData, kiểm tra dữ liệu, gọi service) → `app/(he-thong)/<duong-dan>/page.tsx` (giao diện). Form dùng client component + `useActionState`.
- Đường dẫn tiếng Việt không dấu: `/dang-nhap`, `/dashboard`, `/pos`... Trang sau đăng nhập đặt trong route group `app/(he-thong)/` (có header + nút Đăng xuất).
- **Phân quyền 2 lớp**:
  1. `proxy.ts` (chỉ đọc cookie): chưa đăng nhập → `/dang-nhap`; `/` → trang chủ theo vai trò; Staff vào trang chỉ-Admin → `/pos`. Trang chỉ-Admin khai báo trong `CHI_ADMIN` ở `lib/auth/phanQuyen.ts` — **thêm module Admin mới thì thêm đường dẫn vào đây**.
  2. `lib/auth/dal.ts`: **mọi page và server action** phải gọi `yeuCauDangNhap()` / `yeuCauDangNhap("ADMIN")` (kiểm lại DB, tài khoản bị khóa mất quyền ngay). Không tin proxy là đủ.
- Không chuyển hướng theo vai trò bằng `redirect()` trong lúc render page khi có thể làm ở proxy: redirect giữa lúc render khiến Next chuyển trang phía client, click của người dùng trong lúc đó bị mất (đã gặp với nút Đăng xuất).
- Ghi nhật ký qua `nhatKyRepository.ghi({ maTK, module, hanhDong, noiDung })`. Mã module/hành động viết HOA_KHONG_DAU, vd module `TAI_KHOAN`: `DANG_NHAP`, `DANG_NHAP_THAT_BAI`, `DANG_NHAP_BI_KHOA`, `DANG_XUAT`.
- Kiểm tra trước commit: `npx tsc --noEmit`, `npm run lint`, `npm run build`, chạy thử trên trình duyệt.

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
- `.env` cần thêm `SESSION_SECRET` (tạo bằng `openssl rand -base64 32`) – xem `.env.example`.
- Xem DB bằng DataGrip: localhost:1433, user `sa`, DB `QuanLyBanSach`, bật trust server certificate.

## Quyết định đã chốt (cập nhật dần)
- 04/11/2026 – **Prisma 7.10.1** (bản stable; tag `latest` trên npm đang là 8.0.0-rc → không dùng). Prisma 7 dùng `prisma.config.ts` (URL migrate lấy từ `DATABASE_URL`) và **driver adapter** `@prisma/adapter-mssql` lúc chạy (đọc `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD`). Generator `prisma-client`, import từ `@/lib/generated/prisma/client`. Dùng chung client qua `lib/prisma.ts`.
- 04/11/2026 – Next.js 16.4.5, React 19, Tailwind 4. Next 16 có thay đổi lớn → đọc `node_modules/next/dist/docs/` trước khi viết code Next (xem AGENTS.md).
- 04/11/2026 – **Tắt `cacheComponents`** trong `next.config.ts` (create-next-app 16.4 bật sẵn). Lý do: app nội bộ, mọi trang là dữ liệu động theo người dùng; bật thì mọi chỗ đọc cookie/DB phải bọc `<Suspense>`/`'use cache: private'` – phức tạp không cần thiết.
- 04/11/2026 – **Phiên đăng nhập**: JWT HS256 (thư viện `jose`) trong cookie httpOnly `qlbs_session`, hạn 12 giờ (1 ca). Payload chỉ có `{ maTK, vaiTro }`. `Secure` chỉ bật khi `COOKIE_SECURE=true` (POS chạy http trong LAN). Không thêm bảng phiên (giữ đúng 21 bảng).
- 04/11/2026 – Đăng nhập bằng **số điện thoại** (10 số, bắt đầu 0) + mật khẩu. Sai SĐT hay sai mật khẩu đều báo chung "Số điện thoại hoặc mật khẩu không đúng" (không lộ SĐT nào có tài khoản). Admin → `/dashboard`, Staff → `/pos`; Admin cũng vào được POS.
- 04/11/2026 – Không dùng `next/font/google` (máy POS có thể không có Internet khi build) → font hệ thống.
- 04/11/2026 – Hash mật khẩu dùng **`bcryptjs`** (thuần JS, cùng định dạng hash bcrypt, không cần build native).
- 04/11/2026 – Tên model Prisma = tên bảng (PascalCase tiếng Việt, `@@map` giữ đúng tên bảng); client dùng camelCase: `prisma.taiKhoan`, `prisma.hoaDon`...
- 04/11/2026 – Khóa chính dạng INT IDENTITY (riêng `NhatKyHeThong.maLog` BIGINT). Bảng chi tiết dùng khóa ghép, xóa phiếu/hóa đơn cha thì xóa chi tiết (CASCADE); các FK khác NO ACTION.
- 04/11/2026 – Giá trị trạng thái chưa nêu trong lược đồ gốc: `MaGiamGia.trangThai`, `Combo.trangThai` = `HOAT_DONG | NGUNG_HOAT_DONG`.
- 04/11/2026 – CHECK constraint trong migration `init`: các "enum", `giaBan >= giaNhap`, `0 <= soLuongTamGiu <= soLuongTon`, điểm ≥ 0, mã giảm giá `daSuDung <= soLuongToiDa`, `%` ≤ 100, `CauHinhHeThong.maCH = 1` (1 dòng).
- 04/11/2026 – `KhachHang.maHang` bắt buộc (khách mới gán hạng có `diemToiThieu` thấp nhất). `NhatKyHeThong.maTK` cho phép NULL (vd: đăng nhập thất bại). `HoaDon.phuongThucTT` NULL khi đang lập.
- 04/11/2026 – **VAT theo thể loại**: thêm cột `TheLoai.thueSuatVAT` và snapshot `ChiTietHoaDon.thueSuatVAT` (migration `them_thue_suat_vat`, CHECK 0–100). Seed có 12 thể loại: thêm "Giáo trình – Sách giáo khoa", "Chính trị – Pháp luật" (0%); "Khoa học", "Lịch sử" 0%; còn lại 5%.
- 04/11/2026 – Thứ tự giảm giá hạng → mã → điểm, VAT sau giảm (chi tiết ở mục Quy tắc nghiệp vụ).
- 04/11/2026 – `HoaDon.thueVAT`, `tienGiam` lưu **số tiền** (tienGiam = giảm hạng + giảm mã + giảm điểm). `CauHinhHeThong.tyLeQuyDoiDiem` = số tiền chi tiêu để được 1 điểm (mặc định 10.000đ); `giaTriMotDiem` = giá trị 1 điểm khi đổi (mặc định 1.000đ).

## Câu hỏi còn mở (cần nhóm chốt)
- Điểm cộng đang tính trên `tongTien` (đã gồm VAT, sau mọi giảm giá). Nếu muốn tính trên tiền trước thuế thì sửa 1 dòng trong `tinhTienHoaDon.ts`.

## Tiến độ
- [x] Khởi tạo Next.js + Prisma, `schema.prisma` 21 bảng, migrate lên SQL Server Docker, seed dữ liệu mẫu (04/11/2026).
- [x] Đăng nhập / đăng xuất, phân quyền Admin → Dashboard, Staff → POS, chặn tài khoản khóa, ghi nhật ký (04/11/2026, branch `feature/dang-nhap`). Dashboard và POS hiện là trang giữ chỗ.
- [ ] Quên mật khẩu bằng OTP (bảng MaOTP) – chưa làm, cần chốt kênh gửi OTP (email/SMS/hiển thị cho Admin).
- [ ] POS bán hàng
- [ ] Các module còn lại (3–10), mỗi module 1 branch `feature/<module>`.

## Lưu ý cho báo cáo (đã xử lý ở bản Lan04 track changes)
- Thống nhất trạng thái phiếu "Đã duyệt" (UC7.3 đang ghi "Hoàn tất").
- Hình đánh số tiếp từ Hình 3.59 (lược đồ CSDL).