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
- **Prisma ORM** (provider `sqlserver`). Đăng nhập tự viết: session cookie + `bcrypt`. Xuất Excel: `exceljs` (4.4).
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
10. HoaDon(maHD PK, maTK FK, maKH FK null, maMGG FK null, thoiGianTao, thoiGianCapNhat, trangThai DANG_LAP|DA_THANH_TOAN|DA_HUY, tamTinh, giamCombo, giamHangThe, giamMaGiamGia, giamDiem, thueVAT, diemSuDung, diemCong, tongTien, phuongThucTT TIEN_MAT|QUET_THE|MA_QR, tienKhachDua, lyDoHuy)
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
- Thanh toán – **thứ tự: Tạm tính → Combo → ưu đãi hạng thẻ (%) → mã giảm giá → đổi điểm → + VAT = Tổng tiền** (VAT tính SAU giảm). Cài đặt duy nhất ở `lib/services/tinhTienHoaDon.ts` (hàm thuần, POS và seed dùng chung – không tự tính lại ở chỗ khác). Mỗi khoản lưu riêng vào `HoaDon.giamCombo/giamHangThe/giamMaGiamGia/giamDiem`:
  1. **Combo** (còn hiệu lực: HOAT_DONG + trong ngày áp dụng): đếm số BỘ đủ trong giỏ; giảm = (tổng giá lẻ 1 bộ − giaCombo) × số bộ. Một cuốn chỉ thuộc 1 bộ; combo tiết kiệm nhiều hơn/bộ xét trước; combo không rẻ hơn giá lẻ bị bỏ qua. ChiTietHoaDon vẫn lưu từng cuốn với giá lẻ.
  2. `giamHangThe` = (tiền sau combo) × phanTramUuDai của hạng.
  3. Mã giảm giá: kiểm tra hạn, lượt dùng (ở service) và **đơn tối thiểu xét trên số tiền sau combo**; PHAN_TRAM tính trên số tiền sau ưu đãi hạng.
  4. Đổi điểm: diemSuDung ≤ diemHienTai, giá trị = điểm × giaTriMotDiem, không vượt số tiền còn lại.
  5. VAT: giảm combo phân bổ cho các dòng thuộc combo; các khoản giảm còn lại phân bổ theo tỷ lệ tiền từng dòng; mỗi dòng nhân thuế suất của thể loại. Làm tròn đến đồng.
  - Cộng điểm = floor(tongTien / tyLeQuyDoiDiem) (chỉ khi có KH thành viên); xét thăng hạng theo diemTichLuy.
- **Thuế GTGT sách**: 0% (không chịu thuế) cho sách phục vụ chính trị, giáo dục, văn hóa (sách giáo khoa, giáo trình, chính trị – pháp luật, khoa học, lịch sử...); 5% cho sách còn lại (tham khảo, ngoại ngữ, truyện, kỹ năng sống...). Thuế suất gắn theo **thể loại** (`TheLoai.thueSuatVAT`) → khi thêm sách phải chọn đúng thể loại.
- Hủy hóa đơn đã thanh toán (chỉ Admin, bắt buộc lý do): hoàn kho, trừ điểm khách.
- **Đơn đang lập (DANG_LAP) bị hủy ở 3 thời điểm** → `DA_HUY` + `lyDoHuy` + giải phóng tạm giữ + nhật ký `HUY_DON_DANG_LAP`:
  1. Nhân viên bấm "Hủy đơn" → "Nhân viên hủy đơn đang lập".
  2. Đăng xuất (UC1.2): còn sách trong đơn thì cảnh báo "Đơn hàng chưa hoàn tất"; Đồng ý → "Hủy khi nhân viên đăng xuất".
  3. **Quá 30 phút không cập nhật** (`HoaDon.thoiGianCapNhat`, hằng `HAN_DON_NHAP_PHUT`) → "Tự động hủy do quá thời gian". Không dùng job nền: **lazy cleanup** – trước mỗi lần mở POS / thao tác giỏ / thanh toán, hủy mọi đơn DANG_LAP quá hạn (của mọi nhân viên). Nhân viên có đơn bị tự hủy trong 10 phút gần đây được báo trên POS.
  - Mọi thao tác sửa đơn đều cập nhật `thoiGianCapNhat`. Hủy dùng UPDATE có điều kiện `WHERE trangThai = 'DANG_LAP'` (không giải phóng tạm giữ 2 lần); thanh toán cũng chỉ chuyển trạng thái nếu đơn còn DANG_LAP.
  - Phân biệt đơn nháp đã hủy với hóa đơn đã thanh toán rồi bị hủy: đơn nháp có `phuongThucTT IS NULL`. **Báo cáo doanh thu chỉ tính DA_THANH_TOAN.**
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
  1. `proxy.ts` (chỉ đọc cookie): chưa đăng nhập → `/dang-nhap`; `/` → trang chủ theo vai trò; Staff vào trang chỉ-Admin → `/pos`. Trang chỉ-Admin khai báo bằng **RegExp** trong `CHI_ADMIN` ở `lib/auth/phanQuyen.ts` (vd `/^\/sach\/.+/` = mọi trang con của /sach, còn /sach thì Staff xem được) — **thêm module Admin mới thì thêm mẫu vào đây**.
  2. `lib/auth/dal.ts`: **mọi page và server action** phải gọi `yeuCauDangNhap()` / `yeuCauDangNhap("ADMIN")` (kiểm lại DB, tài khoản bị khóa mất quyền ngay). Không tin proxy là đủ.
- Không chuyển hướng theo vai trò bằng `redirect()` trong lúc render page khi có thể làm ở proxy: redirect giữa lúc render khiến Next chuyển trang phía client, click của người dùng trong lúc đó bị mất (đã gặp với nút Đăng xuất).
- Ghi nhật ký qua `nhatKyRepository.ghi({ maTK, module, hanhDong, noiDung })`. Mã module/hành động viết HOA_KHONG_DAU, vd module `TAI_KHOAN`: `DANG_NHAP`, `DANG_NHAP_THAT_BAI`, `DANG_NHAP_BI_KHOA`, `DANG_XUAT`.
- Transaction: repository nhận tham số `db: Db` (`lib/db.ts`) để dùng được cả `prisma` lẫn `tx` trong `prisma.$transaction(async (tx) => ...)`.
- Thay đổi số lượng kho/lượt dùng bằng **UPDATE có điều kiện** (`$executeRaw` … `WHERE soLuongTon - soLuongTamGiu >= n`) rồi kiểm tra số dòng bị ảnh hưởng, không đọc-rồi-ghi → hai quầy bán cùng lúc không bán vượt tồn.
- Lỗi nghiệp vụ: service ném **`LoiNghiepVu(message, loiTruong?)`** (`lib/loi.ts`; `LoiPOS`, `LoiKhachHang` kế thừa nó). `loiTruong` = lỗi theo từng ô (key = `name` của input). Server action dùng `batLoiNghiepVu(fn, duLieu)` + `docForm(fd)` ở `lib/ketQuaForm.ts` → trả `{ loi, loiTruong, duLieu }`. Form nhỏ dùng `app/components/FormHanhDong.tsx`; form nhiều ô làm theo mẫu `app/(he-thong)/sach/FormSach.tsx` (lỗi dưới từng ô, giữ lại giá trị đã nhập nhờ `duLieu`). Lỗi khác cứ để ném ra.
- Service nhận dữ liệu thô từ form (chuỗi), tự chuẩn hóa (trim, gộp khoảng trắng) + kiểm tra, gom mọi lỗi theo ô rồi ném 1 lần.
- Trong component client, **không định nghĩa component bên trong component** (lint `react-hooks` báo lỗi) – dùng hàm trả JSX như `o(ten, nhan, props)` trong FormSach.
- Thêm route mới mà `PageProps<"/duong-dan">` báo lỗi kiểu → chạy `npx next typegen`.
- Server action đổi dữ liệu xong gọi `refresh()` (từ `next/cache`) để trang tự cập nhật.
- Form tìm kiếm (GET) dùng `<Form>` của `next/form` (chuyển trang phía client). Form GET thường tải lại cả trang → click trong ~0,5 giây đầu khi trang đang hydrate bị mất (đã gặp ở POS).
- Định dạng tiền/ngày: `lib/dinhDang.ts` (`tienVND`, `ngayGio`).
- Sau `prisma generate` (đổi schema) phải **khởi động lại `npm run dev`**: PrismaClient được giữ trong `globalThis` qua hot-reload nên vẫn là bản cũ → lỗi `PrismaClientValidationError` với cột mới.
- Form client có dòng được render sẵn từ server: **không dùng `<tfoot>`** trong bảng của form đó (gây lỗi hydration ở FormPhieuKho) – đặt dòng tổng thành `<div>` dưới bảng. Trang server component (không hydrate) dùng `<tfoot>` bình thường.
- Kiểm tra trước commit: `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm test` (tự seed trước và sau), chạy thử trên trình duyệt.

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
- 04/11/2026 – **POS**: giỏ hàng = hóa đơn `DANG_LAP` lưu trong DB, mỗi nhân viên tối đa 1 đơn đang lập (khách, mã, điểm cũng lưu trên đơn). Thêm sách → tăng tạm giữ; giá bán và thuế suất được **chụp lúc thêm vào đơn**. Khi mở POS mà còn đơn nháp chưa hết hạn thì mở lại đơn đó (tải lại trang/mất mạng không mất giỏ).
- 04/11/2026 – Khi thanh toán, `HoaDon.thoiGianTao` được đặt lại = **thời điểm thanh toán** (báo cáo doanh thu theo ngày dùng cột này).
- 04/11/2026 – **Tách `HoaDon.tienGiam` thành `giamCombo`, `giamHangThe`, `giamMaGiamGia`, `giamDiem`** (bill hiện từng khoản, báo cáo + hoàn điểm chính xác) và thêm `HoaDon.thoiGianCapNhat` (migration `tach_tien_giam_va_thoi_gian_cap_nhat`, viết tay). Vẫn 21 bảng. POS có **Combo** bản đơn giản (xem Quy tắc nghiệp vụ).
- 04/11/2026 – Thêm cột `HoaDon.diemCong` (migration `them_diem_cong_hoa_don`) để khi hủy hóa đơn đã thanh toán trừ đúng số điểm đã cộng.
- 04/11/2026 – Mã giảm giá kiểm tra (trạng thái, ngày, lượt) lúc áp **và** lúc thanh toán; lượt dùng tăng khi thanh toán. Đổi mã → số điểm đã nhập bị đặt lại 0. Bỏ khách hàng → bỏ điểm. Mã nhập không phân biệt hoa/thường.
- 04/11/2026 – Thăng hạng: sau thanh toán, hạng = hạng có `diemToiThieu` cao nhất ≤ `diemTichLuy` (chỉ nâng, không hạ).
- 04/11/2026 – **Tạo nhanh khách hàng tại POS** (UC3.1 luồng 7a): SĐT chưa đăng ký → form nhỏ (SĐT có sẵn + họ tên) → tạo khách hạng thấp nhất, 0 điểm, gắn vào đơn. Nghiệp vụ tạo khách nằm ở `lib/services/khachHangService.ts` (`taoMoi`, kiểm tra SĐT/họ tên/email, ghi nhật ký `KHACH_HANG/THEM`) – **màn hình Khách hàng phải dùng lại service này**.
- 04/11/2026 – **Quản lý sách**: Staff chỉ **xem** danh sách `/sach` (tra cứu); thêm/sửa sách, ngừng kinh doanh/mở bán lại, quản lý thể loại chỉ Admin. **Không sửa tồn kho ở màn hình sách** (sách mới tồn = 0; kho chỉ đổi qua phiếu nhập/kiểm kê/xuất hủy có duyệt). **Không xóa sách** – chỉ ngừng kinh doanh. ISBN 10 hoặc 13 số (bỏ dấu gạch), duy nhất; năm XB 1900..năm sau; định mức mặc định 5; ảnh bìa là đường dẫn (chưa có upload file). "Sắp hết hàng" = `soLuongTon ≤ dinhMucToiThieu`. Danh sách 15 sách/trang.
- 04/11/2026 – **Thể loại**: thuế suất chỉ chọn 0% hoặc 5%; tên duy nhất (không phân biệt hoa/thường theo collation SQL Server); chỉ xóa được thể loại chưa có sách. Đổi giá sách / thuế suất thể loại chỉ áp dụng cho đơn mới. Nhật ký module `SACH` (THEM, SUA – ghi giá cũ→mới, NGUNG_KINH_DOANH, MO_BAN_LAI) và `THE_LOAI` (THEM, SUA, XOA).
- 04/11/2026 – **Nhà cung cấp** (`/nha-cung-cap`, **chỉ Admin**; Staff chỉ chọn NCC khi lập phiếu nhập): MST 10 số hoặc 10 số-3 số (chi nhánh), duy nhất; SĐT tùy chọn 10–11 số bắt đầu 0. Không xóa NCC đã có phiếu nhập → "Ngừng giao dịch" (không chọn được khi lập phiếu mới); NCC chưa có phiếu nào thì xóa được. Nhật ký module `NHA_CUNG_CAP` (THEM, SUA, NGUNG_GIAO_DICH, MO_LAI, XOA). Nghiệp vụ ở `nhaCungCapService.ts`.
- 04/11/2026 – **Phiếu nhập** (`/kho/phieu-nhap`, cùng vòng đời & khối Duyệt/Từ chối với kiểm kê/xuất hủy; `khoService.lapPhieuNhap/duyetPhieuNhap/tuChoiPhieuNhap`): Staff/Admin lập; NCC phải đang giao dịch; chỉ nhập sách đang bán; SL > 0; **0 < giá nhập ≤ giá bán hiện tại**; `tongTien` = Σ SL × giá nhập. **Duyệt → cộng tồn + cập nhật `Sach.giaNhap` = giá nhập của phiếu (giá nhập mới nhất)**, UPDATE có điều kiện `giaBan >= giá mới` – nếu Admin đã hạ giá bán dưới giá nhập thì không duyệt được (rollback cả phiếu). Nhật ký `KHO`: LAP_/DUYET_/TU_CHOI_PHIEU_NHAP (ghi giá nhập cũ → mới). Trang Tồn kho có nút "Lập phiếu nhập cho các sách này" (`/kho/phieu-nhap/tao?sapHet=1` thêm sẵn sách sắp hết).
- 04/11/2026 – **Kho (kiểm kê, xuất hủy)** – `/kho` (tổng quan + sách sắp hết), `/kho/kiem-ke`, `/kho/xuat-huy` (danh sách lọc trạng thái, `/tao`, `/[ma]`). Staff **và** Admin lập phiếu, xem mọi phiếu; chỉ Admin duyệt/từ chối (từ chối bắt buộc lý do; Admin được duyệt phiếu chính mình lập). Nghiệp vụ ở `lib/services/khoService.ts`, repository chung `phieuKhoRepository.ts`; thay đổi kho dùng `sachRepository.dieuChinhTon(db, maSach, ±n)` (UPDATE có điều kiện `soLuongTon + n >= soLuongTamGiu`) – **phiếu nhập (module 5) dùng lại hàm này**.
  - Kiểm kê: `slHeThong` = tồn lúc lập; lệch thì bắt buộc lý do. **Duyệt = cộng chênh lệch (slThucTe − slHeThong) vào tồn hiện tại**, không ghi đè bằng slThucTe (giữa lúc lập và duyệt có thể đã bán thêm). Một sách không được nằm trong 2 phiếu kiểm kê chờ duyệt cùng lúc.
  - Xuất hủy: SL hủy ≤ tồn − tạm giữ, bắt buộc lý do mỗi dòng; không giữ chỗ khi lập, kiểm tra lại lúc duyệt.
  - Duyệt trong 1 transaction, chuyển trạng thái có điều kiện `WHERE trangThai = 'CHO_DUYET'`; 1 dòng không đủ hàng → rollback cả phiếu, phiếu vẫn chờ duyệt. Nhật ký module `KHO`: LAP_/DUYET_/TU_CHOI_ + KIEM_KE | XUAT_HUY. Giá trị tồn / giá trị hủy (theo giá nhập) chỉ Admin thấy.
- 04/11/2026 – **Khách hàng** (`/khach-hang`, nghiệp vụ ở `khachHangService.ts`, POS tạo nhanh cũng dùng `taoMoi`): Staff và Admin tra cứu (SĐT/tên/email, lọc hạng, sắp theo điểm), thêm, sửa thông tin (kể cả đổi SĐT, vẫn duy nhất). **Điểm không sửa tay** – chỉ đổi qua thanh toán/hủy hóa đơn. Chỉ Admin xóa khách, và chỉ khi khách chưa có hóa đơn nào. Trang chi tiết: thống kê mua (chỉ tính DA_THANH_TOAN), số điểm còn thiếu để lên hạng kế, lịch sử tích/đổi điểm suy ra từ hóa đơn (không thêm bảng). `kiemTra` gom lỗi theo ô (`loiTruong`); message = lỗi đầu tiên nếu chỉ 1 lỗi (POS hiển thị message).
- 04/11/2026 – **Hạng thành viên** (`/khach-hang/hang`, chỉ Admin): thêm/sửa/xóa hạng; tên và mốc điểm duy nhất; ưu đãi 0–50% (tối đa 2 số lẻ); **luôn có đúng 1 hạng mốc 0 điểm** (hạng khách mới – không đổi mốc, không xóa). **Hạng của khách = hạng có mốc cao nhất ≤ diemTichLuy**: mỗi lần lưu/xóa hạng → xét lại hạng toàn bộ khách bằng 1 câu UPDATE (`khachHangRepository.xetLaiHang`, có thể hạ hạng). Nhật ký module `HANG_THANH_VIEN`. Tỷ lệ quy đổi điểm chỉ hiển thị ở đây, sửa ở Cài đặt (module 10).
- 04/11/2026 – **Khuyến mãi** (`/khuyen-mai` gồm mã giảm giá + combo; nghiệp vụ ở `khuyenMaiService.ts`): Staff xem danh sách (tư vấn khách), thêm/sửa/ngừng/xóa chỉ Admin (`/khuyen-mai/ma/...`, `/khuyen-mai/combo/...`). Nhật ký module `MA_GIAM_GIA`, `COMBO` (THEM, SUA, NGUNG, MO_LAI, XOA).
  - Mã: `maCode` viết HOA, 3–30 ký tự `A-Z 0-9 _ -`, duy nhất; PHAN_TRAM 0–100% (2 số lẻ), SO_TIEN số nguyên > 0; đơn tối thiểu ≥ 0; số lượt ≥ 1 và ≥ số lượt đã dùng. **Ngày áp dụng tính theo ngày**: 0:00 ngày bắt đầu → 23:59:59 ngày kết thúc (`docNgayInput` ở `lib/dinhDang.ts`). Tình trạng hiển thị suy ra (`tinhTrang`): Đang áp dụng / Chưa bắt đầu / Hết hạn / Hết lượt / Ngừng. **Mã đã dùng (daSuDung > 0 hoặc gắn vào hóa đơn, kể cả đơn nháp) → không đổi maCode, không xóa**, chỉ ngừng hoạt động. Sửa mức giảm áp ngay cho đơn đang lập, hóa đơn cũ giữ số tiền.
  - Combo: ≥ 2 cuốn, sách đang bán, SL 1–20/sách, **giá combo < tổng giá lẻ hiện tại**; sửa = thay toàn bộ dòng sách; xóa được (hóa đơn chỉ lưu `giamCombo`, không tham chiếu combo).
- 04/11/2026 – **Dashboard + báo cáo** (chỉ Admin; nghiệp vụ ở `baoCaoService.ts`, Excel ở `xuatExcelBaoCao.ts`, thư viện **`exceljs` 4.4**):
  - **Doanh thu = Σ tongTien hóa đơn DA_THANH_TOAN** (gồm VAT, sau mọi giảm); hóa đơn đã hủy chỉ đếm riêng. Ngày = `thoiGianTao` theo giờ máy chủ; gom nhóm làm ở Node (SQL Server lưu UTC). Theo thể loại / theo sách = thành tiền từng dòng **trước giảm giá cấp hóa đơn** (cộng lại = tạm tính). Không tính lãi gộp (ChiTietHoaDon không chụp giá nhập).
  - `/dashboard`: hôm nay (so với hôm qua), tháng này, biểu đồ cột 7 ngày, việc cần xử lý (phiếu chờ duyệt, sách sắp hết, đơn đang lập), top 5 sách 30 ngày, hóa đơn gần đây. `/bao-cao`: chọn khoảng ngày (mặc định tháng này, tối đa 366 ngày, có nút nhanh), cơ cấu doanh thu (tạm tính − combo − hạng − mã − điểm + VAT), theo ngày/thể loại/top 10 sách/nhân viên/phương thức.
  - Xuất Excel: route handler `GET /bao-cao/excel?tuNgay&denNgay` → 7 sheet (Tổng hợp, Theo ngày, Theo thể loại, Sách bán chạy, Theo nhân viên, Theo phương thức, Hóa đơn – gồm cả HĐ đã hủy để đối chiếu). exceljs ghi Date theo UTC → **bù múi giờ** (`gioDiaPhuong`) trước khi ghi. Nhật ký `BAO_CAO/XUAT_EXCEL`.
  - Biểu đồ: `app/components/BieuDoCot.tsx` (server component HTML/CSS, 1 chuỗi 1 màu, tooltip khi rê chuột – theo skill dataviz). Không dùng thư viện biểu đồ.
- 04/11/2026 – **Cài đặt** (`/cai-dat`, chỉ Admin, 4 tab; nghiệp vụ ở `caiDatService.ts`, `taiKhoanService.ts`):
  - **Cửa hàng & thanh toán**: tên/địa chỉ/SĐT/MST/logo (URL, in trên hóa đơn); tích điểm `tyLeQuyDoiDiem` 1.000–1.000.000đ, **`giaTriMotDiem` < `tyLeQuyDoiDiem`**; phải bật ≥ 1 phương thức thanh toán (POS ẩn + chặn phương thức tắt). Áp dụng ngay cho đơn chưa thanh toán. Nhật ký `CAI_DAT/SUA` ghi giá trị cũ → mới.
  - **Tài khoản**: SĐT = tên đăng nhập, **không đổi sau khi tạo**; mật khẩu 6–72 ký tự; luôn còn ≥ 1 Admin hoạt động; Admin không tự khóa/tự hạ quyền. **Khóa tài khoản → hủy đơn đang lập của người đó** (`LY_DO_HUY.KHOA_TAI_KHOAN`, trả tạm giữ) và mất quyền ở request kế tiếp (DAL đọc DB). Admin đặt lại mật khẩu cho người khác; mỗi người tự đổi mật khẩu ở **`/ca-nhan`** (bấm tên trên header; cần mật khẩu hiện tại). Đổi mật khẩu không đuổi phiên đang mở (JWT không lưu DB) – muốn đuổi ngay thì khóa. Nhật ký `TAI_KHOAN`: THEM, SUA, KHOA, MO_KHOA, DAT_LAI_MAT_KHAU, DOI_MAT_KHAU.
  - **Nhật ký hệ thống**: lọc module / người / ngày / từ khóa, 50 dòng/trang.
  - **Sao lưu**: `BACKUP DATABASE … COPY_ONLY` ra `/var/opt/mssql/data/QuanLyBanSach_YYYYMMDD_HHmmss.bak` (trong volume `mssql_data`), ghi `BanSaoLuu` (kích thước lấy từ `msdb.dbo.backupset`). **Phục hồi làm thủ công** (đã thử chạy được): `docker exec -it qlbs-mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -C -Q "ALTER DATABASE QuanLyBanSach SET SINGLE_USER WITH ROLLBACK IMMEDIATE; RESTORE DATABASE QuanLyBanSach FROM DISK = N'<file .bak>' WITH REPLACE; ALTER DATABASE QuanLyBanSach SET MULTI_USER;"`.
  - Ô số tiền/% dùng `step` 1 / 0.01 (step lớn khiến trình duyệt chặn giá như 99.900đ); kiểm tra thật ở server.
- 04/11/2026 – Staff chỉ xem/in được hóa đơn do mình lập; Admin xem tất cả. Trang hóa đơn: **`/hoa-don/[maHD]`** (POS thanh toán xong chuyển tới đây), in bằng `window.print()` (header ẩn khi in).
- 04/11/2026 – **Hóa đơn** (`/hoa-don`, nghiệp vụ ở `hoaDonService.ts`): tra cứu theo số HĐ (`123`/`#123`), SĐT/tên khách, khoảng ngày (theo `thoiGianTao` = lúc thanh toán, giờ máy chủ), trạng thái (Đã thanh toán / Đã hủy sau thanh toán / Đơn nháp đã hủy), phương thức, nhân viên (Admin); 20 HĐ/trang; không liệt kê đơn DANG_LAP. Dòng tổng hợp: doanh thu chỉ tính DA_THANH_TOAN.
  - **Hủy hóa đơn đã thanh toán** (chỉ Admin, lý do bắt buộc ≤ 255 ký tự, 1 transaction, chuyển trạng thái có điều kiện): hoàn kho từng dòng; khách: `diemHienTai += diemSuDung − diemCong` (**khách đã tiêu bớt điểm thì về 0**, nhật ký ghi số điểm hụt), `diemTichLuy −= diemCong`, **xét lại hạng theo điểm tích lũy (có thể hạ hạng)**; hoàn 1 lượt mã giảm giá; số tiền trên hóa đơn giữ nguyên; `lyDoHuy`, `thoiGianCapNhat` = lúc hủy. Nhật ký `HOA_DON/HUY`. Không hủy được đơn chưa thanh toán (đơn nháp hủy ở POS).
  - Seed: 3 hóa đơn mẫu có khách thành viên (#2 Nam/Bạc, #4 Hà/Vàng, #7 Mai/Đồng) để minh họa ưu đãi hạng, điểm cộng và hủy hóa đơn.
- 04/11/2026 – Hash mật khẩu dùng **`bcryptjs`** (thuần JS, cùng định dạng hash bcrypt, không cần build native).
- 04/11/2026 – Tên model Prisma = tên bảng (PascalCase tiếng Việt, `@@map` giữ đúng tên bảng); client dùng camelCase: `prisma.taiKhoan`, `prisma.hoaDon`...
- 04/11/2026 – Khóa chính dạng INT IDENTITY (riêng `NhatKyHeThong.maLog` BIGINT). Bảng chi tiết dùng khóa ghép, xóa phiếu/hóa đơn cha thì xóa chi tiết (CASCADE); các FK khác NO ACTION.
- 04/11/2026 – Giá trị trạng thái chưa nêu trong lược đồ gốc: `MaGiamGia.trangThai`, `Combo.trangThai` = `HOAT_DONG | NGUNG_HOAT_DONG`.
- 04/11/2026 – CHECK constraint trong migration `init`: các "enum", `giaBan >= giaNhap`, `0 <= soLuongTamGiu <= soLuongTon`, điểm ≥ 0, mã giảm giá `daSuDung <= soLuongToiDa`, `%` ≤ 100, `CauHinhHeThong.maCH = 1` (1 dòng).
- 04/11/2026 – `KhachHang.maHang` bắt buộc (khách mới gán hạng có `diemToiThieu` thấp nhất). `NhatKyHeThong.maTK` cho phép NULL (vd: đăng nhập thất bại). `HoaDon.phuongThucTT` NULL khi đang lập.
- 04/11/2026 – **VAT theo thể loại**: thêm cột `TheLoai.thueSuatVAT` và snapshot `ChiTietHoaDon.thueSuatVAT` (migration `them_thue_suat_vat`, CHECK 0–100). Seed có 12 thể loại: thêm "Giáo trình – Sách giáo khoa", "Chính trị – Pháp luật" (0%); "Khoa học", "Lịch sử" 0%; còn lại 5%.
- 04/11/2026 – Thứ tự giảm giá hạng → mã → điểm, VAT sau giảm (chi tiết ở mục Quy tắc nghiệp vụ).
- 04/11/2026 – `HoaDon.thueVAT`, `tienGiam` lưu **số tiền** (tienGiam = giảm hạng + giảm mã + giảm điểm). `CauHinhHeThong.tyLeQuyDoiDiem` = số tiền chi tiêu để được 1 điểm (mặc định 10.000đ); `giaTriMotDiem` = giá trị 1 điểm khi đổi (mặc định 1.000đ).

- 04/11/2026 – **CI GitHub Actions** (`.github/workflows/blank.yml`, repo `nvgbaobu/OOAD`), chạy mỗi push lên `main` / pull request, 2 job song song:
  - `build`: `npm ci` → `prisma generate` → lint → `next typegen` + `tsc` → build. Code ở **gốc repo**. `DATABASE_URL` giả (generate không kết nối DB).
  - `test`: service container **SQL Server 2025** (mật khẩu chỉ dùng trong CI) → `prisma migrate deploy` trên CSDL **mới tinh** → `npm test` (9 bộ). `TZ=Asia/Ho_Chi_Minh`.
  - Nhờ chạy trên CSDL mới đã phát hiện & sửa 2 lỗi seed: (1) `DBCC CHECKIDENT … RESEED, 0` trên bảng chưa từng có dòng làm ID bắt đầu từ **0** (admin maTK = 0, mọi ID lệch; `Number(x) || null` coi 0 là rỗng) → chỉ reseed bảng đã sinh ID (`sys.identity_columns.last_value IS NOT NULL`); (2) hóa đơn/phiếu mẫu "hôm nay 8–9h" nằm ở tương lai nếu seed chạy sáng sớm → `daQua()` lùi về 5 phút trước. **Dữ liệu mẫu "đã xảy ra" phải luôn ở quá khứ.**

## Câu hỏi còn mở (cần nhóm chốt)
- Điểm cộng đang tính trên `tongTien` (đã gồm VAT, sau mọi giảm giá). Nếu muốn tính trên tiền trước thuế thì sửa 1 dòng trong `tinhTienHoaDon.ts`.

## Tiến độ
- [x] Khởi tạo Next.js + Prisma, `schema.prisma` 21 bảng, migrate lên SQL Server Docker, seed dữ liệu mẫu (04/11/2026).
- [x] Đăng nhập / đăng xuất, phân quyền Admin → Dashboard, Staff → POS, chặn tài khoản khóa, ghi nhật ký (04/11/2026, branch `feature/dang-nhap`).
- [ ] Quên mật khẩu bằng OTP (bảng MaOTP) – chưa làm, cần chốt kênh gửi OTP (email/SMS/hiển thị cho Admin). Tạm thời: Admin đặt lại mật khẩu ở Cài đặt → Tài khoản.
- [x] POS bán hàng: tìm sách, giỏ hàng (tạm giữ kho), chọn / tạo nhanh khách thành viên, combo, mã giảm giá, đổi điểm, VAT, tự hủy đơn nháp quá 30 phút / khi đăng xuất, thanh toán 3 phương thức + tiền thừa, xem/in hóa đơn, hủy đơn nháp (04/11/2026, branch `feature/pos`). Kiểm thử nghiệp vụ: `npm run test:pos` (**ghi vào DB thật, chạy xong tự seed lại**).
- [x] Quản lý sách + thể loại & VAT (04/11/2026, branch `feature/quan-ly-sach`). Kiểm thử: `npm run test:sach`; chạy cả bộ: `npm test` (**ghi DB thật, xong tự seed lại**).
- [x] Tồn kho + phiếu kiểm kê / xuất hủy, lập → duyệt / từ chối (04/11/2026, branch `feature/ton-kho`). Kiểm thử: `npm run test:kho`.
- [x] Nhà cung cấp + phiếu nhập (04/11/2026, branch `feature/nha-cung-cap`). Kiểm thử: `npm run test:nhap`.
- [x] Hóa đơn: tra cứu, chi tiết/in, hủy hóa đơn đã thanh toán (04/11/2026, branch `feature/hoa-don`). Kiểm thử: `npm run test:hoa-don`.
- [x] Khách hàng + hạng thành viên & tích điểm (04/11/2026, branch `feature/khach-hang`). Kiểm thử: `npm run test:khach-hang`.
- [x] Khuyến mãi: mã giảm giá + combo (04/11/2026, branch `feature/ma-giam-gia`). Kiểm thử: `npm run test:khuyen-mai`.
- [x] Dashboard + báo cáo doanh thu + xuất Excel (04/11/2026, branch `feature/dashboard`). Kiểm thử: `npm run test:bao-cao`.
- [x] Cài đặt: cấu hình cửa hàng/tích điểm/thanh toán, tài khoản, đổi mật khẩu, nhật ký, sao lưu (04/11/2026, branch `feature/cai-dat`). Kiểm thử: `npm run test:cai-dat`. **Đủ 10 module demo** – `npm test` chạy 9 bộ kiểm thử., mỗi module 1 branch `feature/<module>`.

## Lưu ý cho báo cáo (đã xử lý ở bản Lan04 track changes)
- Thống nhất trạng thái phiếu "Đã duyệt" (UC7.3 đang ghi "Hoàn tất").
- **Cần sửa báo cáo** (04/11/2026): lược đồ HoaDon đổi (thêm thoiGianCapNhat, tách tienGiam thành 4 cột giamCombo/giamHangThe/giamMaGiamGia/giamDiem); UC3.3 thêm luồng "Hệ thống tự hủy đơn quá hạn"; UC1.2 ghi rõ đơn nháp bị hủy khi đăng xuất; thứ tự giảm giá Combo → hạng → mã → điểm → VAT.
- Hình đánh số tiếp từ Hình 3.59 (lược đồ CSDL).