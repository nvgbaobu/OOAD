# Phần mềm Quản lý cửa hàng bán sách – Nhóm 09

Đồ án môn **Phân tích thiết kế hướng đối tượng** – Trường ĐH Sài Gòn. GVHD: ThS. Hoàng Mạnh Hà.

Thành viên: Vũ Tiến Thịnh, Lê Hoàng An, Nguyễn Võ Gia Bảo, Quách Tuấn Hào, Nguyễn Trung Hiếu, Tạ Ngọc Khánh Huy.

Bản demo hệ thống bán sách **tại quầy (POS)**, chạy nội bộ, 2 vai trò **Admin** và **Staff**. Kiến trúc 3 lớp khớp báo cáo:
giao diện (`app/`) → nghiệp vụ (`lib/services/`) → truy cập dữ liệu (`lib/repositories/`) → thực thể (Prisma, 21 bảng).

> Lược đồ 21 bảng: `prisma/schema.prisma` (mỗi bảng có chú thích). Quy tắc tính tiền: `lib/services/tinhTienHoaDon.ts`.

## Công nghệ

| Thành phần | Phiên bản |
|---|---|
| Next.js (App Router) + React + TypeScript | 16.4 / 19 / 5 |
| Tailwind CSS | 4 |
| Prisma ORM + `@prisma/adapter-mssql` | 7.10 |
| SQL Server (Docker) | 2025 |
| Đăng nhập | JWT (`jose`) trong cookie httpOnly, mật khẩu `bcryptjs` |
| Xuất Excel | `exceljs` 4.4 |

## Cài đặt & chạy

### Cách 1 – Chạy demo bằng Docker Desktop (không cần cài Node.js)

```bash
docker compose up -d --build              # SQL Server 2025 + app (tự chạy migrate khi khởi động)
docker compose exec app npx prisma db seed  # nạp dữ liệu mẫu (lần đầu / muốn làm mới)
```

Mở http://localhost:3000. Dừng: `docker compose stop`. Dữ liệu nằm trong volume `mssql_data` (không mất khi tắt máy).

### Cách 2 – Chạy để phát triển

Yêu cầu: Node.js ≥ 20, Docker.

```bash
cp .env.example .env              # sửa SESSION_SECRET: openssl rand -base64 32
docker compose up -d mssql        # chỉ SQL Server 2025 (container qlbs-mssql, cổng 1433)
npm install
npx prisma migrate deploy         # tạo CSDL QuanLyBanSach + 21 bảng + ràng buộc CHECK
npx prisma generate               # sinh Prisma Client vào lib/generated/prisma
npx prisma db seed                # dữ liệu mẫu (chạy lại bao nhiêu lần cũng được)
npm run dev                       # http://localhost:3000
```

Mật khẩu `sa` trong `.env.example` / `docker-compose.yml` chỉ dùng cho máy dev chạy local – đổi nếu triển khai thật.

### Tài khoản mẫu (mật khẩu `123456`)

| Vai trò | Số điện thoại | Sau đăng nhập |
|---|---|---|
| Admin | `0900000001` | Dashboard |
| Staff | `0900000002` (Lê Hoàng An), `0900000003` (Quách Tuấn Hào) | Bán hàng (POS) |

Dữ liệu mẫu: 129 đầu sách / 12 thể loại (30 sách mẫu + 99 sách ngoại văn bán chạy lấy từ Fahasa, ISBN là mã giả), 8 khách hàng thành viên (Đồng/Bạc/Vàng), 4 nhà cung cấp, 5 mã giảm giá, 1 combo,
7 hóa đơn trong 7 ngày gần nhất, phiếu nhập/kiểm kê/xuất hủy đang chờ duyệt.

## Chức năng (10 module)

| # | Module | Đường dẫn | Quyền |
|---|---|---|---|
| 1 | Đăng nhập / đăng xuất, đổi mật khẩu cá nhân, quên mật khẩu bằng OTP (giả lập SMS) | `/dang-nhap`, `/quen-mat-khau`, `/ca-nhan` | Tất cả |
| 2 | Bán hàng tại quầy: giỏ hàng (tạm giữ kho), khách thành viên, combo, mã giảm giá, đổi điểm, VAT, 3 phương thức thanh toán, in hóa đơn | `/pos` | Tất cả |
| 3 | Quản lý sách, thể loại | `/sach` | Staff xem, Admin sửa |
| 4 | Tồn kho, phiếu kiểm kê, phiếu xuất hủy (lập → duyệt) | `/kho` | Staff lập, Admin duyệt |
| 5 | Nhà cung cấp, phiếu nhập (lập → duyệt) | `/nha-cung-cap`, `/kho/phieu-nhap` | NCC: Admin; phiếu: Staff lập, Admin duyệt |
| 6 | Hóa đơn: tra cứu, xem/in, hủy hóa đơn đã thanh toán (hoàn kho, điểm, mã) | `/hoa-don` | Staff xem HĐ của mình, Admin tất cả + hủy |
| 7 | Khách hàng, lịch sử tích điểm, hạng thành viên | `/khach-hang` | Staff + Admin; cấu hình hạng: Admin |
| 8 | Khuyến mãi: mã giảm giá, combo sách | `/khuyen-mai` | Staff xem, Admin sửa |
| 9 | Dashboard, báo cáo doanh thu, xuất Excel | `/dashboard`, `/bao-cao` | Admin |
| 10 | Cài đặt: cửa hàng/tích điểm/thanh toán, tài khoản, nhật ký hệ thống, sao lưu CSDL | `/cai-dat` | Admin |

Thứ tự tính tiền: **Tạm tính → Combo → Ưu đãi hạng → Mã giảm giá → Đổi điểm → + VAT 5% = Tổng tiền**
(cài đặt duy nhất ở `lib/services/tinhTienHoaDon.ts`). VAT một mức 5% cho mọi hóa đơn; điểm cộng = tổng tiền ÷ tỷ lệ quy đổi (suy ra, không lưu riêng).

Ảnh chụp các màn hình (dùng cho mục 3.1.7 của báo cáo): [`docs/man-hinh/`](docs/man-hinh/) – tên file bắt đầu bằng số module.

## Kiểm thử

Các script kiểm thử nghiệp vụ chạy trên CSDL thật rồi **tự seed lại** dữ liệu mẫu:

```bash
npm test                 # chạy cả 10 bộ
npm run test:pos         # hoặc từng bộ: test:sach, test:kho, test:nhap, test:hoa-don, test:khach-hang,
                         #   test:khuyen-mai, test:bao-cao, test:cai-dat, test:quen-mat-khau
```

Trước khi commit: `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm test`.

## Cấu trúc thư mục

```
app/
  (he-thong)/<module>/   giao diện các trang sau đăng nhập (route group, có header chung)
  actions/               server actions – đọc form, kiểm quyền, gọi service
  components/            thành phần dùng chung (FormHanhDong, BieuDoCot, FormMatKhau)
  dang-nhap/             trang đăng nhập
  quen-mat-khau/         khôi phục mật khẩu bằng OTP
lib/
  services/              nghiệp vụ (BUS) – kiểm tra dữ liệu, giao dịch, ghi nhật ký
  repositories/          truy vấn Prisma (DAO)
  auth/                  phiên đăng nhập, phân quyền (proxy + DAL)
prisma/                  schema.prisma (21 bảng), migrations, seed.ts, du-lieu/ (sách Fahasa)
scripts/                 kiểm thử nghiệp vụ (npm test)
docs/man-hinh/           ảnh chụp màn hình
proxy.ts                 chuyển hướng theo đăng nhập / vai trò
```

## Quy trình làm việc

- Mỗi module làm trên 1 branch `feature/<module>`, chạy được và qua kiểm tra mới merge vào `main`.
- Commit message tiếng Việt: `feat(<module>): ...`, `fix(...)`, `chore(...)`.
- Đổi lược đồ: sửa `prisma/schema.prisma` → `npx prisma migrate dev --name <ten>` (ràng buộc CHECK thêm tay vào file migration) → `npx prisma generate` → cập nhật seed nếu cần.
