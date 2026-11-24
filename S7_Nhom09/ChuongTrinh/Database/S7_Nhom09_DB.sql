/* ====================================================================
   S7_Nhom09_DB.sql - CSDL Phan mem Quan ly cua hang ban sach (Nhom 09)
   He quan tri: Microsoft SQL Server 2025 (tuong thich 2019+)
   Gom: tao CSDL QuanLyBanSach + 21 bang + rang buoc CHECK + du lieu mau
   Tai khoan mau (mat khau 123456): Admin 0900000001; Staff 0900000002..0900000006
   Sinh tu prisma/migrations + prisma/seed.ts ngay 23/11/2026
   ==================================================================== */
IF DB_ID(N'QuanLyBanSach') IS NOT NULL
BEGIN
    ALTER DATABASE QuanLyBanSach SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE QuanLyBanSach;
END
GO
CREATE DATABASE QuanLyBanSach;
GO
USE QuanLyBanSach;
GO

-- ===== Migration: 20261104035852_init =====
BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[TaiKhoan] (
    [maTK] INT NOT NULL IDENTITY(1,1),
    [soDienThoai] VARCHAR(15) NOT NULL,
    [matKhauHash] VARCHAR(255) NOT NULL,
    [hoTen] NVARCHAR(100) NOT NULL,
    [email] NVARCHAR(100),
    [vaiTro] NVARCHAR(10) NOT NULL CONSTRAINT [TaiKhoan_vaiTro_df] DEFAULT 'STAFF',
    [trangThai] NVARCHAR(20) NOT NULL CONSTRAINT [TaiKhoan_trangThai_df] DEFAULT 'HOAT_DONG',
    [ngayTao] DATETIME2 NOT NULL CONSTRAINT [TaiKhoan_ngayTao_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [TaiKhoan_pkey] PRIMARY KEY CLUSTERED ([maTK]),
    CONSTRAINT [TaiKhoan_soDienThoai_key] UNIQUE NONCLUSTERED ([soDienThoai])
);

-- CreateTable
CREATE TABLE [dbo].[MaOTP] (
    [maOTP] INT NOT NULL IDENTITY(1,1),
    [maTK] INT NOT NULL,
    [maCode] VARCHAR(10) NOT NULL,
    [thoiGianHetHan] DATETIME2 NOT NULL,
    [daSuDung] BIT NOT NULL CONSTRAINT [MaOTP_daSuDung_df] DEFAULT 0,
    CONSTRAINT [MaOTP_pkey] PRIMARY KEY CLUSTERED ([maOTP])
);

-- CreateTable
CREATE TABLE [dbo].[TheLoai] (
    [maTL] INT NOT NULL IDENTITY(1,1),
    [tenTL] NVARCHAR(100) NOT NULL,
    CONSTRAINT [TheLoai_pkey] PRIMARY KEY CLUSTERED ([maTL]),
    CONSTRAINT [TheLoai_tenTL_key] UNIQUE NONCLUSTERED ([tenTL])
);

-- CreateTable
CREATE TABLE [dbo].[Sach] (
    [maSach] INT NOT NULL IDENTITY(1,1),
    [isbn] VARCHAR(20) NOT NULL,
    [tenSach] NVARCHAR(255) NOT NULL,
    [tacGia] NVARCHAR(150) NOT NULL,
    [nhaXuatBan] NVARCHAR(150),
    [namXB] INT,
    [maTL] INT NOT NULL,
    [giaNhap] DECIMAL(12,2) NOT NULL,
    [giaBan] DECIMAL(12,2) NOT NULL,
    [hinhAnh] NVARCHAR(500),
    [viTriKe] NVARCHAR(50),
    [soLuongTon] INT NOT NULL CONSTRAINT [Sach_soLuongTon_df] DEFAULT 0,
    [soLuongTamGiu] INT NOT NULL CONSTRAINT [Sach_soLuongTamGiu_df] DEFAULT 0,
    [dinhMucToiThieu] INT NOT NULL CONSTRAINT [Sach_dinhMucToiThieu_df] DEFAULT 5,
    [trangThai] NVARCHAR(20) NOT NULL CONSTRAINT [Sach_trangThai_df] DEFAULT 'DANG_BAN',
    CONSTRAINT [Sach_pkey] PRIMARY KEY CLUSTERED ([maSach]),
    CONSTRAINT [Sach_isbn_key] UNIQUE NONCLUSTERED ([isbn])
);

-- CreateTable
CREATE TABLE [dbo].[HangThanhVien] (
    [maHang] INT NOT NULL IDENTITY(1,1),
    [tenHang] NVARCHAR(50) NOT NULL,
    [diemToiThieu] INT NOT NULL CONSTRAINT [HangThanhVien_diemToiThieu_df] DEFAULT 0,
    [phanTramUuDai] DECIMAL(5,2) NOT NULL CONSTRAINT [HangThanhVien_phanTramUuDai_df] DEFAULT 0,
    CONSTRAINT [HangThanhVien_pkey] PRIMARY KEY CLUSTERED ([maHang]),
    CONSTRAINT [HangThanhVien_tenHang_key] UNIQUE NONCLUSTERED ([tenHang])
);

-- CreateTable
CREATE TABLE [dbo].[KhachHang] (
    [maKH] INT NOT NULL IDENTITY(1,1),
    [soDienThoai] VARCHAR(15) NOT NULL,
    [hoTen] NVARCHAR(100) NOT NULL,
    [email] NVARCHAR(100),
    [diaChi] NVARCHAR(255),
    [diemHienTai] INT NOT NULL CONSTRAINT [KhachHang_diemHienTai_df] DEFAULT 0,
    [diemTichLuy] INT NOT NULL CONSTRAINT [KhachHang_diemTichLuy_df] DEFAULT 0,
    [maHang] INT NOT NULL,
    [ngayTao] DATETIME2 NOT NULL CONSTRAINT [KhachHang_ngayTao_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [KhachHang_pkey] PRIMARY KEY CLUSTERED ([maKH]),
    CONSTRAINT [KhachHang_soDienThoai_key] UNIQUE NONCLUSTERED ([soDienThoai])
);

-- CreateTable
CREATE TABLE [dbo].[MaGiamGia] (
    [maMGG] INT NOT NULL IDENTITY(1,1),
    [maCode] VARCHAR(30) NOT NULL,
    [loaiGiam] NVARCHAR(10) NOT NULL,
    [giaTriGiam] DECIMAL(12,2) NOT NULL,
    [giaTriDonToiThieu] DECIMAL(12,2) NOT NULL CONSTRAINT [MaGiamGia_giaTriDonToiThieu_df] DEFAULT 0,
    [soLuongToiDa] INT NOT NULL,
    [daSuDung] INT NOT NULL CONSTRAINT [MaGiamGia_daSuDung_df] DEFAULT 0,
    [ngayBatDau] DATETIME2 NOT NULL,
    [ngayKetThuc] DATETIME2 NOT NULL,
    [trangThai] NVARCHAR(20) NOT NULL CONSTRAINT [MaGiamGia_trangThai_df] DEFAULT 'HOAT_DONG',
    CONSTRAINT [MaGiamGia_pkey] PRIMARY KEY CLUSTERED ([maMGG]),
    CONSTRAINT [MaGiamGia_maCode_key] UNIQUE NONCLUSTERED ([maCode])
);

-- CreateTable
CREATE TABLE [dbo].[Combo] (
    [maCombo] INT NOT NULL IDENTITY(1,1),
    [tenCombo] NVARCHAR(150) NOT NULL,
    [giaCombo] DECIMAL(12,2) NOT NULL,
    [ngayBatDau] DATETIME2 NOT NULL,
    [ngayKetThuc] DATETIME2 NOT NULL,
    [trangThai] NVARCHAR(20) NOT NULL CONSTRAINT [Combo_trangThai_df] DEFAULT 'HOAT_DONG',
    CONSTRAINT [Combo_pkey] PRIMARY KEY CLUSTERED ([maCombo])
);

-- CreateTable
CREATE TABLE [dbo].[ChiTietCombo] (
    [maCombo] INT NOT NULL,
    [maSach] INT NOT NULL,
    [soLuong] INT NOT NULL CONSTRAINT [ChiTietCombo_soLuong_df] DEFAULT 1,
    CONSTRAINT [ChiTietCombo_pkey] PRIMARY KEY CLUSTERED ([maCombo],[maSach])
);

-- CreateTable
CREATE TABLE [dbo].[HoaDon] (
    [maHD] INT NOT NULL IDENTITY(1,1),
    [maTK] INT NOT NULL,
    [maKH] INT,
    [maMGG] INT,
    [thoiGianTao] DATETIME2 NOT NULL CONSTRAINT [HoaDon_thoiGianTao_df] DEFAULT CURRENT_TIMESTAMP,
    [trangThai] NVARCHAR(20) NOT NULL CONSTRAINT [HoaDon_trangThai_df] DEFAULT 'DANG_LAP',
    [tamTinh] DECIMAL(12,2) NOT NULL CONSTRAINT [HoaDon_tamTinh_df] DEFAULT 0,
    [thueVAT] DECIMAL(12,2) NOT NULL CONSTRAINT [HoaDon_thueVAT_df] DEFAULT 0,
    [tienGiam] DECIMAL(12,2) NOT NULL CONSTRAINT [HoaDon_tienGiam_df] DEFAULT 0,
    [diemSuDung] INT NOT NULL CONSTRAINT [HoaDon_diemSuDung_df] DEFAULT 0,
    [tongTien] DECIMAL(12,2) NOT NULL CONSTRAINT [HoaDon_tongTien_df] DEFAULT 0,
    [phuongThucTT] NVARCHAR(10),
    [tienKhachDua] DECIMAL(12,2),
    [lyDoHuy] NVARCHAR(500),
    CONSTRAINT [HoaDon_pkey] PRIMARY KEY CLUSTERED ([maHD])
);

-- CreateTable
CREATE TABLE [dbo].[ChiTietHoaDon] (
    [maHD] INT NOT NULL,
    [maSach] INT NOT NULL,
    [soLuong] INT NOT NULL,
    [donGiaBan] DECIMAL(12,2) NOT NULL,
    [thanhTien] DECIMAL(12,2) NOT NULL,
    CONSTRAINT [ChiTietHoaDon_pkey] PRIMARY KEY CLUSTERED ([maHD],[maSach])
);

-- CreateTable
CREATE TABLE [dbo].[NhaCungCap] (
    [maNCC] INT NOT NULL IDENTITY(1,1),
    [tenNCC] NVARCHAR(150) NOT NULL,
    [diaChi] NVARCHAR(255),
    [maSoThue] VARCHAR(20) NOT NULL,
    [nguoiLienHe] NVARCHAR(100),
    [soDienThoai] VARCHAR(15),
    [trangThaiHopTac] NVARCHAR(20) NOT NULL CONSTRAINT [NhaCungCap_trangThaiHopTac_df] DEFAULT 'DANG_GIAO_DICH',
    CONSTRAINT [NhaCungCap_pkey] PRIMARY KEY CLUSTERED ([maNCC]),
    CONSTRAINT [NhaCungCap_maSoThue_key] UNIQUE NONCLUSTERED ([maSoThue])
);

-- CreateTable
CREATE TABLE [dbo].[PhieuNhap] (
    [maPN] INT NOT NULL IDENTITY(1,1),
    [maNCC] INT NOT NULL,
    [maTKLap] INT NOT NULL,
    [maTKDuyet] INT,
    [ngayLap] DATETIME2 NOT NULL CONSTRAINT [PhieuNhap_ngayLap_df] DEFAULT CURRENT_TIMESTAMP,
    [ngayDuyet] DATETIME2,
    [trangThai] NVARCHAR(20) NOT NULL CONSTRAINT [PhieuNhap_trangThai_df] DEFAULT 'CHO_DUYET',
    [tongTien] DECIMAL(12,2) NOT NULL CONSTRAINT [PhieuNhap_tongTien_df] DEFAULT 0,
    [ghiChu] NVARCHAR(500),
    [lyDoTuChoi] NVARCHAR(500),
    CONSTRAINT [PhieuNhap_pkey] PRIMARY KEY CLUSTERED ([maPN])
);

-- CreateTable
CREATE TABLE [dbo].[ChiTietPhieuNhap] (
    [maPN] INT NOT NULL,
    [maSach] INT NOT NULL,
    [soLuong] INT NOT NULL,
    [giaNhap] DECIMAL(12,2) NOT NULL,
    CONSTRAINT [ChiTietPhieuNhap_pkey] PRIMARY KEY CLUSTERED ([maPN],[maSach])
);

-- CreateTable
CREATE TABLE [dbo].[PhieuKiemKe] (
    [maPKK] INT NOT NULL IDENTITY(1,1),
    [maTKLap] INT NOT NULL,
    [maTKDuyet] INT,
    [ngayLap] DATETIME2 NOT NULL CONSTRAINT [PhieuKiemKe_ngayLap_df] DEFAULT CURRENT_TIMESTAMP,
    [ngayDuyet] DATETIME2,
    [trangThai] NVARCHAR(20) NOT NULL CONSTRAINT [PhieuKiemKe_trangThai_df] DEFAULT 'CHO_DUYET',
    [ghiChu] NVARCHAR(500),
    [lyDoTuChoi] NVARCHAR(500),
    CONSTRAINT [PhieuKiemKe_pkey] PRIMARY KEY CLUSTERED ([maPKK])
);

-- CreateTable
CREATE TABLE [dbo].[ChiTietKiemKe] (
    [maPKK] INT NOT NULL,
    [maSach] INT NOT NULL,
    [slHeThong] INT NOT NULL,
    [slThucTe] INT NOT NULL,
    [lyDoChenhLech] NVARCHAR(500),
    CONSTRAINT [ChiTietKiemKe_pkey] PRIMARY KEY CLUSTERED ([maPKK],[maSach])
);

-- CreateTable
CREATE TABLE [dbo].[PhieuXuatHuy] (
    [maPXH] INT NOT NULL IDENTITY(1,1),
    [maTKLap] INT NOT NULL,
    [maTKDuyet] INT,
    [ngayLap] DATETIME2 NOT NULL CONSTRAINT [PhieuXuatHuy_ngayLap_df] DEFAULT CURRENT_TIMESTAMP,
    [ngayDuyet] DATETIME2,
    [trangThai] NVARCHAR(20) NOT NULL CONSTRAINT [PhieuXuatHuy_trangThai_df] DEFAULT 'CHO_DUYET',
    [ghiChu] NVARCHAR(500),
    [lyDoTuChoi] NVARCHAR(500),
    CONSTRAINT [PhieuXuatHuy_pkey] PRIMARY KEY CLUSTERED ([maPXH])
);

-- CreateTable
CREATE TABLE [dbo].[ChiTietXuatHuy] (
    [maPXH] INT NOT NULL,
    [maSach] INT NOT NULL,
    [soLuong] INT NOT NULL,
    [lyDo] NVARCHAR(500),
    CONSTRAINT [ChiTietXuatHuy_pkey] PRIMARY KEY CLUSTERED ([maPXH],[maSach])
);

-- CreateTable
CREATE TABLE [dbo].[CauHinhHeThong] (
    [maCH] INT NOT NULL CONSTRAINT [CauHinhHeThong_maCH_df] DEFAULT 1,
    [tenCuaHang] NVARCHAR(150) NOT NULL,
    [diaChi] NVARCHAR(255),
    [soDienThoai] VARCHAR(15),
    [logo] NVARCHAR(500),
    [maSoThue] VARCHAR(20),
    [tyLeQuyDoiDiem] DECIMAL(12,2) NOT NULL CONSTRAINT [CauHinhHeThong_tyLeQuyDoiDiem_df] DEFAULT 10000,
    [giaTriMotDiem] DECIMAL(12,2) NOT NULL CONSTRAINT [CauHinhHeThong_giaTriMotDiem_df] DEFAULT 1000,
    [ttTienMat] BIT NOT NULL CONSTRAINT [CauHinhHeThong_ttTienMat_df] DEFAULT 1,
    [ttQuetThe] BIT NOT NULL CONSTRAINT [CauHinhHeThong_ttQuetThe_df] DEFAULT 1,
    [ttMaQR] BIT NOT NULL CONSTRAINT [CauHinhHeThong_ttMaQR_df] DEFAULT 1,
    CONSTRAINT [CauHinhHeThong_pkey] PRIMARY KEY CLUSTERED ([maCH])
);

-- CreateTable
CREATE TABLE [dbo].[NhatKyHeThong] (
    [maLog] BIGINT NOT NULL IDENTITY(1,1),
    [maTK] INT,
    [thoiGian] DATETIME2 NOT NULL CONSTRAINT [NhatKyHeThong_thoiGian_df] DEFAULT CURRENT_TIMESTAMP,
    [module] NVARCHAR(50) NOT NULL,
    [hanhDong] NVARCHAR(50) NOT NULL,
    [noiDung] NVARCHAR(max),
    CONSTRAINT [NhatKyHeThong_pkey] PRIMARY KEY CLUSTERED ([maLog])
);

-- CreateTable
CREATE TABLE [dbo].[BanSaoLuu] (
    [maBackup] INT NOT NULL IDENTITY(1,1),
    [maTK] INT NOT NULL,
    [thoiGian] DATETIME2 NOT NULL CONSTRAINT [BanSaoLuu_thoiGian_df] DEFAULT CURRENT_TIMESTAMP,
    [duongDanFile] NVARCHAR(500) NOT NULL,
    [kichThuoc] BIGINT NOT NULL CONSTRAINT [BanSaoLuu_kichThuoc_df] DEFAULT 0,
    CONSTRAINT [BanSaoLuu_pkey] PRIMARY KEY CLUSTERED ([maBackup])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [MaOTP_maTK_idx] ON [dbo].[MaOTP]([maTK]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Sach_maTL_idx] ON [dbo].[Sach]([maTL]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [KhachHang_maHang_idx] ON [dbo].[KhachHang]([maHang]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [HoaDon_maTK_idx] ON [dbo].[HoaDon]([maTK]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [HoaDon_maKH_idx] ON [dbo].[HoaDon]([maKH]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [HoaDon_thoiGianTao_idx] ON [dbo].[HoaDon]([thoiGianTao]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [PhieuNhap_maNCC_idx] ON [dbo].[PhieuNhap]([maNCC]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [NhatKyHeThong_thoiGian_idx] ON [dbo].[NhatKyHeThong]([thoiGian]);

-- AddForeignKey
ALTER TABLE [dbo].[MaOTP] ADD CONSTRAINT [MaOTP_maTK_fkey] FOREIGN KEY ([maTK]) REFERENCES [dbo].[TaiKhoan]([maTK]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Sach] ADD CONSTRAINT [Sach_maTL_fkey] FOREIGN KEY ([maTL]) REFERENCES [dbo].[TheLoai]([maTL]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[KhachHang] ADD CONSTRAINT [KhachHang_maHang_fkey] FOREIGN KEY ([maHang]) REFERENCES [dbo].[HangThanhVien]([maHang]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ChiTietCombo] ADD CONSTRAINT [ChiTietCombo_maCombo_fkey] FOREIGN KEY ([maCombo]) REFERENCES [dbo].[Combo]([maCombo]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ChiTietCombo] ADD CONSTRAINT [ChiTietCombo_maSach_fkey] FOREIGN KEY ([maSach]) REFERENCES [dbo].[Sach]([maSach]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[HoaDon] ADD CONSTRAINT [HoaDon_maTK_fkey] FOREIGN KEY ([maTK]) REFERENCES [dbo].[TaiKhoan]([maTK]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[HoaDon] ADD CONSTRAINT [HoaDon_maKH_fkey] FOREIGN KEY ([maKH]) REFERENCES [dbo].[KhachHang]([maKH]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[HoaDon] ADD CONSTRAINT [HoaDon_maMGG_fkey] FOREIGN KEY ([maMGG]) REFERENCES [dbo].[MaGiamGia]([maMGG]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ChiTietHoaDon] ADD CONSTRAINT [ChiTietHoaDon_maHD_fkey] FOREIGN KEY ([maHD]) REFERENCES [dbo].[HoaDon]([maHD]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ChiTietHoaDon] ADD CONSTRAINT [ChiTietHoaDon_maSach_fkey] FOREIGN KEY ([maSach]) REFERENCES [dbo].[Sach]([maSach]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PhieuNhap] ADD CONSTRAINT [PhieuNhap_maNCC_fkey] FOREIGN KEY ([maNCC]) REFERENCES [dbo].[NhaCungCap]([maNCC]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PhieuNhap] ADD CONSTRAINT [PhieuNhap_maTKLap_fkey] FOREIGN KEY ([maTKLap]) REFERENCES [dbo].[TaiKhoan]([maTK]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PhieuNhap] ADD CONSTRAINT [PhieuNhap_maTKDuyet_fkey] FOREIGN KEY ([maTKDuyet]) REFERENCES [dbo].[TaiKhoan]([maTK]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ChiTietPhieuNhap] ADD CONSTRAINT [ChiTietPhieuNhap_maPN_fkey] FOREIGN KEY ([maPN]) REFERENCES [dbo].[PhieuNhap]([maPN]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ChiTietPhieuNhap] ADD CONSTRAINT [ChiTietPhieuNhap_maSach_fkey] FOREIGN KEY ([maSach]) REFERENCES [dbo].[Sach]([maSach]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PhieuKiemKe] ADD CONSTRAINT [PhieuKiemKe_maTKLap_fkey] FOREIGN KEY ([maTKLap]) REFERENCES [dbo].[TaiKhoan]([maTK]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PhieuKiemKe] ADD CONSTRAINT [PhieuKiemKe_maTKDuyet_fkey] FOREIGN KEY ([maTKDuyet]) REFERENCES [dbo].[TaiKhoan]([maTK]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ChiTietKiemKe] ADD CONSTRAINT [ChiTietKiemKe_maPKK_fkey] FOREIGN KEY ([maPKK]) REFERENCES [dbo].[PhieuKiemKe]([maPKK]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ChiTietKiemKe] ADD CONSTRAINT [ChiTietKiemKe_maSach_fkey] FOREIGN KEY ([maSach]) REFERENCES [dbo].[Sach]([maSach]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PhieuXuatHuy] ADD CONSTRAINT [PhieuXuatHuy_maTKLap_fkey] FOREIGN KEY ([maTKLap]) REFERENCES [dbo].[TaiKhoan]([maTK]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PhieuXuatHuy] ADD CONSTRAINT [PhieuXuatHuy_maTKDuyet_fkey] FOREIGN KEY ([maTKDuyet]) REFERENCES [dbo].[TaiKhoan]([maTK]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ChiTietXuatHuy] ADD CONSTRAINT [ChiTietXuatHuy_maPXH_fkey] FOREIGN KEY ([maPXH]) REFERENCES [dbo].[PhieuXuatHuy]([maPXH]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ChiTietXuatHuy] ADD CONSTRAINT [ChiTietXuatHuy_maSach_fkey] FOREIGN KEY ([maSach]) REFERENCES [dbo].[Sach]([maSach]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[NhatKyHeThong] ADD CONSTRAINT [NhatKyHeThong_maTK_fkey] FOREIGN KEY ([maTK]) REFERENCES [dbo].[TaiKhoan]([maTK]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[BanSaoLuu] ADD CONSTRAINT [BanSaoLuu_maTK_fkey] FOREIGN KEY ([maTK]) REFERENCES [dbo].[TaiKhoan]([maTK]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

-- ===== CHECK constraints (thêm tay: thay cho ENUM / quy tắc nghiệp vụ) =====
BEGIN TRY
BEGIN TRAN;
ALTER TABLE [dbo].[TaiKhoan] ADD CONSTRAINT [CK_TaiKhoan_vaiTro] CHECK ([vaiTro] IN (N'ADMIN', N'STAFF'));
ALTER TABLE [dbo].[TaiKhoan] ADD CONSTRAINT [CK_TaiKhoan_trangThai] CHECK ([trangThai] IN (N'HOAT_DONG', N'KHOA'));
ALTER TABLE [dbo].[Sach] ADD CONSTRAINT [CK_Sach_trangThai] CHECK ([trangThai] IN (N'DANG_BAN', N'NGUNG_KINH_DOANH'));
ALTER TABLE [dbo].[Sach] ADD CONSTRAINT [CK_Sach_gia] CHECK ([giaNhap] >= 0 AND [giaBan] >= [giaNhap]);
ALTER TABLE [dbo].[Sach] ADD CONSTRAINT [CK_Sach_soLuong] CHECK ([soLuongTon] >= 0 AND [soLuongTamGiu] >= 0 AND [soLuongTamGiu] <= [soLuongTon] AND [dinhMucToiThieu] >= 0);
ALTER TABLE [dbo].[HangThanhVien] ADD CONSTRAINT [CK_HangThanhVien_giaTri] CHECK ([diemToiThieu] >= 0 AND [phanTramUuDai] BETWEEN 0 AND 100);
ALTER TABLE [dbo].[KhachHang] ADD CONSTRAINT [CK_KhachHang_diem] CHECK ([diemHienTai] >= 0 AND [diemTichLuy] >= 0);
ALTER TABLE [dbo].[MaGiamGia] ADD CONSTRAINT [CK_MaGiamGia_loaiGiam] CHECK ([loaiGiam] IN (N'PHAN_TRAM', N'SO_TIEN'));
ALTER TABLE [dbo].[MaGiamGia] ADD CONSTRAINT [CK_MaGiamGia_trangThai] CHECK ([trangThai] IN (N'HOAT_DONG', N'NGUNG_HOAT_DONG'));
ALTER TABLE [dbo].[MaGiamGia] ADD CONSTRAINT [CK_MaGiamGia_giaTri] CHECK ([giaTriGiam] > 0 AND ([loaiGiam] <> N'PHAN_TRAM' OR [giaTriGiam] <= 100) AND [daSuDung] >= 0 AND [daSuDung] <= [soLuongToiDa] AND [ngayKetThuc] >= [ngayBatDau]);
ALTER TABLE [dbo].[Combo] ADD CONSTRAINT [CK_Combo_trangThai] CHECK ([trangThai] IN (N'HOAT_DONG', N'NGUNG_HOAT_DONG'));
ALTER TABLE [dbo].[Combo] ADD CONSTRAINT [CK_Combo_ngay] CHECK ([ngayKetThuc] >= [ngayBatDau]);
ALTER TABLE [dbo].[ChiTietCombo] ADD CONSTRAINT [CK_ChiTietCombo_soLuong] CHECK ([soLuong] > 0);
ALTER TABLE [dbo].[HoaDon] ADD CONSTRAINT [CK_HoaDon_trangThai] CHECK ([trangThai] IN (N'DANG_LAP', N'DA_THANH_TOAN', N'DA_HUY'));
ALTER TABLE [dbo].[HoaDon] ADD CONSTRAINT [CK_HoaDon_phuongThucTT] CHECK ([phuongThucTT] IS NULL OR [phuongThucTT] IN (N'TIEN_MAT', N'QUET_THE', N'MA_QR'));
ALTER TABLE [dbo].[ChiTietHoaDon] ADD CONSTRAINT [CK_ChiTietHoaDon_soLuong] CHECK ([soLuong] > 0);
ALTER TABLE [dbo].[NhaCungCap] ADD CONSTRAINT [CK_NhaCungCap_trangThai] CHECK ([trangThaiHopTac] IN (N'DANG_GIAO_DICH', N'NGUNG_GIAO_DICH'));
ALTER TABLE [dbo].[PhieuNhap] ADD CONSTRAINT [CK_PhieuNhap_trangThai] CHECK ([trangThai] IN (N'CHO_DUYET', N'DA_DUYET', N'TU_CHOI'));
ALTER TABLE [dbo].[ChiTietPhieuNhap] ADD CONSTRAINT [CK_ChiTietPhieuNhap_soLuong] CHECK ([soLuong] > 0 AND [giaNhap] >= 0);
ALTER TABLE [dbo].[PhieuKiemKe] ADD CONSTRAINT [CK_PhieuKiemKe_trangThai] CHECK ([trangThai] IN (N'CHO_DUYET', N'DA_DUYET', N'TU_CHOI'));
ALTER TABLE [dbo].[ChiTietKiemKe] ADD CONSTRAINT [CK_ChiTietKiemKe_soLuong] CHECK ([slHeThong] >= 0 AND [slThucTe] >= 0);
ALTER TABLE [dbo].[PhieuXuatHuy] ADD CONSTRAINT [CK_PhieuXuatHuy_trangThai] CHECK ([trangThai] IN (N'CHO_DUYET', N'DA_DUYET', N'TU_CHOI'));
ALTER TABLE [dbo].[ChiTietXuatHuy] ADD CONSTRAINT [CK_ChiTietXuatHuy_soLuong] CHECK ([soLuong] > 0);
ALTER TABLE [dbo].[CauHinhHeThong] ADD CONSTRAINT [CK_CauHinhHeThong_motDong] CHECK ([maCH] = 1);
COMMIT TRAN;
END TRY
BEGIN CATCH
IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW
END CATCH

GO

-- ===== Migration: 20261104041549_them_thue_suat_vat =====
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[ChiTietHoaDon] ADD [thueSuatVAT] DECIMAL(5,2) NOT NULL CONSTRAINT [ChiTietHoaDon_thueSuatVAT_df] DEFAULT 0;

-- AlterTable
ALTER TABLE [dbo].[TheLoai] ADD [thueSuatVAT] DECIMAL(5,2) NOT NULL CONSTRAINT [TheLoai_thueSuatVAT_df] DEFAULT 5;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

-- ===== CHECK (thêm tay). Dùng EXEC vì cột vừa thêm trong cùng batch =====
EXEC(N'ALTER TABLE [dbo].[TheLoai] ADD CONSTRAINT [CK_TheLoai_thueSuatVAT] CHECK ([thueSuatVAT] BETWEEN 0 AND 100)');
EXEC(N'ALTER TABLE [dbo].[ChiTietHoaDon] ADD CONSTRAINT [CK_ChiTietHoaDon_thueSuatVAT] CHECK ([thueSuatVAT] BETWEEN 0 AND 100)');

GO

-- ===== Migration: 20261104042959_them_diem_cong_hoa_don =====
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[HoaDon] ADD [diemCong] INT NOT NULL CONSTRAINT [HoaDon_diemCong_df] DEFAULT 0;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

-- CHECK (thêm tay)
EXEC(N'ALTER TABLE [dbo].[HoaDon] ADD CONSTRAINT [CK_HoaDon_diem] CHECK ([diemSuDung] >= 0 AND [diemCong] >= 0)');

GO

-- ===== Migration: 20261104044949_tach_tien_giam_va_thoi_gian_cap_nhat =====
-- Tách HoaDon.tienGiam thành 4 khoản giảm + thêm thoiGianCapNhat (viết tay vì Prisma cần xác nhận xóa cột).
BEGIN TRY

BEGIN TRAN;

ALTER TABLE [dbo].[HoaDon] ADD
    [thoiGianCapNhat] DATETIME2 NOT NULL CONSTRAINT [HoaDon_thoiGianCapNhat_df] DEFAULT CURRENT_TIMESTAMP,
    [giamCombo] DECIMAL(12,2) NOT NULL CONSTRAINT [HoaDon_giamCombo_df] DEFAULT 0,
    [giamHangThe] DECIMAL(12,2) NOT NULL CONSTRAINT [HoaDon_giamHangThe_df] DEFAULT 0,
    [giamMaGiamGia] DECIMAL(12,2) NOT NULL CONSTRAINT [HoaDon_giamMaGiamGia_df] DEFAULT 0,
    [giamDiem] DECIMAL(12,2) NOT NULL CONSTRAINT [HoaDon_giamDiem_df] DEFAULT 0;

-- Dữ liệu cũ không biết tách từng khoản → chặn migrate nếu có hóa đơn đã giảm giá (chỉ có dữ liệu seed, đều = 0)
EXEC(N'IF EXISTS (SELECT 1 FROM [dbo].[HoaDon] WHERE [tienGiam] <> 0) THROW 50001, N''Có hóa đơn tienGiam <> 0, cần tách tay'', 1;');
EXEC(N'UPDATE [dbo].[HoaDon] SET [thoiGianCapNhat] = [thoiGianTao]');

ALTER TABLE [dbo].[HoaDon] DROP CONSTRAINT [HoaDon_tienGiam_df];
ALTER TABLE [dbo].[HoaDon] DROP COLUMN [tienGiam];

CREATE NONCLUSTERED INDEX [HoaDon_trangThai_thoiGianCapNhat_idx] ON [dbo].[HoaDon]([trangThai], [thoiGianCapNhat]);

EXEC(N'ALTER TABLE [dbo].[HoaDon] ADD CONSTRAINT [CK_HoaDon_giam] CHECK ([giamCombo] >= 0 AND [giamHangThe] >= 0 AND [giamMaGiamGia] >= 0 AND [giamDiem] >= 0)');

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

GO

-- ===== Migration: 20261113130000_dong_bo_bao_cao =====
-- Đồng bộ lược đồ với báo cáo (mục 3.1.6): bỏ TheLoai.thueSuatVAT, ChiTietHoaDon.thueSuatVAT, HoaDon.diemCong
BEGIN TRY

BEGIN TRAN;

ALTER TABLE [dbo].[TheLoai] DROP CONSTRAINT [CK_TheLoai_thueSuatVAT], [TheLoai_thueSuatVAT_df];
ALTER TABLE [dbo].[TheLoai] DROP COLUMN [thueSuatVAT];

ALTER TABLE [dbo].[ChiTietHoaDon] DROP CONSTRAINT [CK_ChiTietHoaDon_thueSuatVAT], [ChiTietHoaDon_thueSuatVAT_df];
ALTER TABLE [dbo].[ChiTietHoaDon] DROP COLUMN [thueSuatVAT];

ALTER TABLE [dbo].[HoaDon] DROP CONSTRAINT [CK_HoaDon_diem], [HoaDon_diemCong_df];
ALTER TABLE [dbo].[HoaDon] DROP COLUMN [diemCong];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

-- CHECK (thêm tay)
EXEC(N'ALTER TABLE [dbo].[HoaDon] ADD CONSTRAINT [CK_HoaDon_diem] CHECK ([diemSuDung] >= 0)');

GO

-- ===== DU LIEU MAU =====
SET NOCOUNT ON;
BEGIN TRAN;
INSERT INTO [dbo].[CauHinhHeThong] ([maCH], [tenCuaHang], [diaChi], [soDienThoai], [maSoThue], [tyLeQuyDoiDiem], [giaTriMotDiem]) VALUES (1, N'Nhà sách Nhóm 09', N'273 An Dương Vương, Phường Chợ Quán, TP. Hồ Chí Minh', N'02838354409', N'0312345678', 10000, 1000);
SET IDENTITY_INSERT [dbo].[TaiKhoan] ON;
INSERT INTO [dbo].[TaiKhoan] ([soDienThoai], [matKhauHash], [hoTen], [email], [vaiTro], [maTK]) VALUES (N'0900000001', N'$2b$10$VTUhc5QXYdnYRYS5TUgPqOf.emCcD74Lfr/wbwcIpeDfKtv.gFA12', N'Nguyễn Võ Gia Bảo', N'admin@nhasach09.vn', N'ADMIN', 1);
SET IDENTITY_INSERT [dbo].[TaiKhoan] OFF;
SET IDENTITY_INSERT [dbo].[TaiKhoan] ON;
INSERT INTO [dbo].[TaiKhoan] ([soDienThoai], [matKhauHash], [hoTen], [email], [vaiTro], [maTK]) VALUES (N'0900000002', N'$2b$10$VTUhc5QXYdnYRYS5TUgPqOf.emCcD74Lfr/wbwcIpeDfKtv.gFA12', N'Lê Hoàng An', N'an@nhasach09.vn', N'STAFF', 2);
SET IDENTITY_INSERT [dbo].[TaiKhoan] OFF;
SET IDENTITY_INSERT [dbo].[TaiKhoan] ON;
INSERT INTO [dbo].[TaiKhoan] ([soDienThoai], [matKhauHash], [hoTen], [email], [vaiTro], [maTK]) VALUES (N'0900000003', N'$2b$10$VTUhc5QXYdnYRYS5TUgPqOf.emCcD74Lfr/wbwcIpeDfKtv.gFA12', N'Quách Tuấn Hào', N'hao@nhasach09.vn', N'STAFF', 3);
SET IDENTITY_INSERT [dbo].[TaiKhoan] OFF;
SET IDENTITY_INSERT [dbo].[TaiKhoan] ON;
INSERT INTO [dbo].[TaiKhoan] ([soDienThoai], [matKhauHash], [hoTen], [email], [vaiTro], [maTK]) VALUES (N'0900000004', N'$2b$10$VTUhc5QXYdnYRYS5TUgPqOf.emCcD74Lfr/wbwcIpeDfKtv.gFA12', N'Vũ Tiến Thịnh', N'thinh@nhasach09.vn', N'STAFF', 4);
SET IDENTITY_INSERT [dbo].[TaiKhoan] OFF;
SET IDENTITY_INSERT [dbo].[TaiKhoan] ON;
INSERT INTO [dbo].[TaiKhoan] ([soDienThoai], [matKhauHash], [hoTen], [email], [vaiTro], [maTK]) VALUES (N'0900000005', N'$2b$10$VTUhc5QXYdnYRYS5TUgPqOf.emCcD74Lfr/wbwcIpeDfKtv.gFA12', N'Nguyễn Trung Hiếu', N'hieu@nhasach09.vn', N'STAFF', 5);
SET IDENTITY_INSERT [dbo].[TaiKhoan] OFF;
SET IDENTITY_INSERT [dbo].[TaiKhoan] ON;
INSERT INTO [dbo].[TaiKhoan] ([soDienThoai], [matKhauHash], [hoTen], [email], [vaiTro], [maTK]) VALUES (N'0900000006', N'$2b$10$VTUhc5QXYdnYRYS5TUgPqOf.emCcD74Lfr/wbwcIpeDfKtv.gFA12', N'Tạ Ngọc Khánh Huy', N'huy@nhasach09.vn', N'STAFF', 6);
SET IDENTITY_INSERT [dbo].[TaiKhoan] OFF;
SET IDENTITY_INSERT [dbo].[HangThanhVien] ON;
INSERT INTO [dbo].[HangThanhVien] ([tenHang], [diemToiThieu], [phanTramUuDai], [maHang]) VALUES (N'Đồng', 0, 0, 1);
SET IDENTITY_INSERT [dbo].[HangThanhVien] OFF;
SET IDENTITY_INSERT [dbo].[HangThanhVien] ON;
INSERT INTO [dbo].[HangThanhVien] ([tenHang], [diemToiThieu], [phanTramUuDai], [maHang]) VALUES (N'Bạc', 500, 5, 2);
SET IDENTITY_INSERT [dbo].[HangThanhVien] OFF;
SET IDENTITY_INSERT [dbo].[HangThanhVien] ON;
INSERT INTO [dbo].[HangThanhVien] ([tenHang], [diemToiThieu], [phanTramUuDai], [maHang]) VALUES (N'Vàng', 2000, 10, 3);
SET IDENTITY_INSERT [dbo].[HangThanhVien] OFF;
SET IDENTITY_INSERT [dbo].[TheLoai] ON;
INSERT INTO [dbo].[TheLoai] ([tenTL], [maTL]) VALUES (N'Văn học Việt Nam', 1);
SET IDENTITY_INSERT [dbo].[TheLoai] OFF;
SET IDENTITY_INSERT [dbo].[TheLoai] ON;
INSERT INTO [dbo].[TheLoai] ([tenTL], [maTL]) VALUES (N'Văn học nước ngoài', 2);
SET IDENTITY_INSERT [dbo].[TheLoai] OFF;
SET IDENTITY_INSERT [dbo].[TheLoai] ON;
INSERT INTO [dbo].[TheLoai] ([tenTL], [maTL]) VALUES (N'Kinh tế', 3);
SET IDENTITY_INSERT [dbo].[TheLoai] OFF;
SET IDENTITY_INSERT [dbo].[TheLoai] ON;
INSERT INTO [dbo].[TheLoai] ([tenTL], [maTL]) VALUES (N'Kỹ năng sống', 4);
SET IDENTITY_INSERT [dbo].[TheLoai] OFF;
SET IDENTITY_INSERT [dbo].[TheLoai] ON;
INSERT INTO [dbo].[TheLoai] ([tenTL], [maTL]) VALUES (N'Thiếu nhi', 5);
SET IDENTITY_INSERT [dbo].[TheLoai] OFF;
SET IDENTITY_INSERT [dbo].[TheLoai] ON;
INSERT INTO [dbo].[TheLoai] ([tenTL], [maTL]) VALUES (N'Khoa học', 6);
SET IDENTITY_INSERT [dbo].[TheLoai] OFF;
SET IDENTITY_INSERT [dbo].[TheLoai] ON;
INSERT INTO [dbo].[TheLoai] ([tenTL], [maTL]) VALUES (N'Lịch sử', 7);
SET IDENTITY_INSERT [dbo].[TheLoai] OFF;
SET IDENTITY_INSERT [dbo].[TheLoai] ON;
INSERT INTO [dbo].[TheLoai] ([tenTL], [maTL]) VALUES (N'Công nghệ thông tin', 8);
SET IDENTITY_INSERT [dbo].[TheLoai] OFF;
SET IDENTITY_INSERT [dbo].[TheLoai] ON;
INSERT INTO [dbo].[TheLoai] ([tenTL], [maTL]) VALUES (N'Tâm lý', 9);
SET IDENTITY_INSERT [dbo].[TheLoai] OFF;
SET IDENTITY_INSERT [dbo].[TheLoai] ON;
INSERT INTO [dbo].[TheLoai] ([tenTL], [maTL]) VALUES (N'Ngoại ngữ', 10);
SET IDENTITY_INSERT [dbo].[TheLoai] OFF;
SET IDENTITY_INSERT [dbo].[TheLoai] ON;
INSERT INTO [dbo].[TheLoai] ([tenTL], [maTL]) VALUES (N'Giáo trình – Sách giáo khoa', 11);
SET IDENTITY_INSERT [dbo].[TheLoai] OFF;
SET IDENTITY_INSERT [dbo].[TheLoai] ON;
INSERT INTO [dbo].[TheLoai] ([tenTL], [maTL]) VALUES (N'Chính trị – Pháp luật', 12);
SET IDENTITY_INSERT [dbo].[TheLoai] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [nhaXuatBan], [namXB], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786042000001', N'Mắt biếc', N'Nguyễn Nhật Ánh', N'NXB Trẻ', 2019, 1, 70000, 110000, N'A1-01', 40, 1);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [nhaXuatBan], [namXB], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786042000002', N'Cho tôi xin một vé đi tuổi thơ', N'Nguyễn Nhật Ánh', N'NXB Trẻ', 2018, 1, 55000, 85000, N'A1-02', 35, 2);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [nhaXuatBan], [namXB], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786042000003', N'Số đỏ', N'Vũ Trọng Phụng', N'NXB Văn học', 2020, 1, 45000, 72000, N'A1-03', 20, 3);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [nhaXuatBan], [namXB], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786042000004', N'Dế Mèn phiêu lưu ký', N'Tô Hoài', N'NXB Kim Đồng', 2021, 5, 35000, 58000, N'B1-01', 50, 4);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [nhaXuatBan], [namXB], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786042000005', N'Tắt đèn', N'Ngô Tất Tố', N'NXB Văn học', 2019, 1, 40000, 65000, N'A1-04', 3, 5);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [nhaXuatBan], [namXB], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786042000006', N'Nhà giả kim', N'Paulo Coelho', N'NXB Hội Nhà văn', 2020, 2, 50000, 79000, N'A2-01', 60, 6);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [nhaXuatBan], [namXB], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786042000007', N'Rừng Na Uy', N'Haruki Murakami', N'NXB Hội Nhà văn', 2018, 2, 90000, 145000, N'A2-02', 15, 7);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [nhaXuatBan], [namXB], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786042000008', N'Không gia đình', N'Hector Malot', N'NXB Văn học', 2017, 2, 80000, 125000, N'A2-03', 12, 8);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [nhaXuatBan], [namXB], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786042000009', N'Ông già và biển cả', N'Ernest Hemingway', N'NXB Văn học', 2019, 2, 38000, 60000, N'A2-04', 4, 9);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [nhaXuatBan], [namXB], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786042000010', N'Cha giàu cha nghèo', N'Robert Kiyosaki', N'NXB Trẻ', 2021, 3, 75000, 120000, N'C1-01', 30, 10);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [nhaXuatBan], [namXB], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786042000011', N'Nghĩ giàu và làm giàu', N'Napoleon Hill', N'NXB Tổng hợp', 2020, 3, 65000, 105000, N'C1-02', 25, 11);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [nhaXuatBan], [namXB], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786042000012', N'Từ tốt đến vĩ đại', N'Jim Collins', N'NXB Trẻ', 2019, 3, 95000, 150000, N'C1-03', 10, 12);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [nhaXuatBan], [namXB], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786042000013', N'Đắc nhân tâm', N'Dale Carnegie', N'NXB Tổng hợp', 2022, 4, 55000, 88000, N'C2-01', 80, 13);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [nhaXuatBan], [namXB], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786042000014', N'Đời ngắn đừng ngủ dài', N'Robin Sharma', N'NXB Trẻ', 2020, 4, 45000, 75000, N'C2-02', 22, 14);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [nhaXuatBan], [namXB], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786042000015', N'Tuổi trẻ đáng giá bao nhiêu', N'Rosie Nguyễn', N'NXB Hội Nhà văn', 2021, 4, 50000, 80000, N'C2-03', 18, 15);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [nhaXuatBan], [namXB], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786042000016', N'Doraemon tập 1', N'Fujiko F. Fujio', N'NXB Kim Đồng', 2022, 5, 15000, 25000, N'B1-02', 100, 16);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [nhaXuatBan], [namXB], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786042000017', N'Thám tử lừng danh Conan tập 1', N'Gosho Aoyama', N'NXB Kim Đồng', 2022, 5, 16000, 25000, N'B1-03', 90, 17);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [nhaXuatBan], [namXB], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786042000018', N'Hoàng tử bé', N'Antoine de Saint-Exupéry', N'NXB Kim Đồng', 2020, 5, 40000, 65000, N'B1-04', 2, 18);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [nhaXuatBan], [namXB], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786042000019', N'Lược sử thời gian', N'Stephen Hawking', N'NXB Trẻ', 2019, 6, 85000, 135000, N'D1-01', 14, 19);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [nhaXuatBan], [namXB], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786042000020', N'Vũ trụ', N'Carl Sagan', N'NXB Thế giới', 2020, 6, 120000, 189000, N'D1-02', 8, 20);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [nhaXuatBan], [namXB], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786042000021', N'Sapiens: Lược sử loài người', N'Yuval Noah Harari', N'NXB Tri thức', 2021, 7, 140000, 219000, N'D2-01', 20, 21);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [nhaXuatBan], [namXB], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786042000022', N'Việt Nam sử lược', N'Trần Trọng Kim', N'NXB Văn học', 2018, 7, 100000, 160000, N'D2-02', 11, 22);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [nhaXuatBan], [namXB], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786042000023', N'Súng, vi trùng và thép', N'Jared Diamond', N'NXB Thế giới', 2020, 7, 150000, 235000, N'D2-03', 6, 23);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [nhaXuatBan], [namXB], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786042000024', N'Clean Code', N'Robert C. Martin', N'NXB Bách Khoa', 2021, 8, 180000, 280000, N'E1-01', 9, 24);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [nhaXuatBan], [namXB], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786042000025', N'Lập trình Python cơ bản', N'Nhiều tác giả', N'NXB Thông tin và Truyền thông', 2022, 8, 90000, 140000, N'E1-02', 16, 25);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [nhaXuatBan], [namXB], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786042000026', N'Phân tích thiết kế hướng đối tượng với UML', N'Đặng Văn Đức', N'NXB Giáo dục', 2019, 11, 70000, 110000, N'E1-03', 25, 26);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [nhaXuatBan], [namXB], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786042000027', N'Tư duy nhanh và chậm', N'Daniel Kahneman', N'NXB Thế giới', 2020, 9, 130000, 205000, N'F1-01', 13, 27);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [nhaXuatBan], [namXB], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786042000028', N'Sức mạnh của thói quen', N'Charles Duhigg', N'NXB Lao động', 2021, 9, 80000, 129000, N'F1-02', 17, 28);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [nhaXuatBan], [namXB], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786042000029', N'Hackers TOEIC Reading', N'Hackers Academia', N'NXB Tổng hợp', 2022, 10, 150000, 230000, N'G1-01', 21, 29);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [nhaXuatBan], [namXB], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786042000030', N'English Grammar in Use', N'Raymond Murphy', N'NXB Cambridge', 2019, 10, 160000, 250000, N'G1-02', 0, 30);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000001', N'Wonder', N'R. J. Palacio', 5, 144000, 206000, N'B2-01', 5, 31);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000002', N'When Breath Becomes Air', N'Paul Kalanithi', 2, 228000, 325000, N'A3-02', 42, 32);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000003', N'Oxford Learner''s Pocket Dictionary 4Ed', N'Oxford University Press', 10, 63000, 90000, N'G2-03', 38, 33);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000004', N'To Kill a Mockingbird', N'Harper Lee', 2, 158000, 225000, N'A3-04', 34, 34);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000005', N'English Grammar in Use Book with Answers', N'Raymond Murphy', 10, 139000, 198000, N'G2-05', 30, 35);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000006', N'Lean In: Women, Work, And The Will To Lead', N'Sheryl Sandberg', 3, 228000, 325000, N'C3-06', 26, 36);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000007', N'Oxford Learner''s Pocket Phrasal Verbs And Idioms', N'Oxford University Press', 10, 158000, 226000, N'G2-07', 22, 37);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000008', N'Tuesdays with Morrie', N'Mitch Albom', 2, 163000, 233000, N'A3-08', 18, 38);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000009', N'The Alchemist 25th Anniversary', N'Paulo Coelho', 2, 147000, 210000, N'A3-09', 14, 39);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000010', N'365 Days of Wonder', N'R. J. Palacio', 5, 165000, 236000, N'B2-10', 10, 40);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000011', N'The Power Of Habit', N'Charles Duhigg', 9, 248000, 355000, N'F2-11', 6, 41);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000012', N'Quiet: The Power of Introverts', N'Susan Cain', 9, 276000, 394000, N'F2-12', 43, 42);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000013', N'Me Before You', N'Jojo Moyes', 2, 163000, 233000, N'A3-13', 39, 43);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000014', N'Oxford Idioms Dictionary', N'Oxford University Press', 10, 106000, 151000, N'G2-14', 35, 44);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000015', N'Oxford Phrasal Verbs Dictionary', N'Oxford University Press', 10, 115000, 164000, N'G2-15', 31, 45);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000016', N'Zero to One', N'Peter Thiel', 3, 278000, 397000, N'C3-16', 27, 46);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000017', N'Complete IELTS B2 Student''s Book', N'Guy Brook-Hart', 10, 195000, 279000, N'G2-17', 23, 47);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000018', N'Advanced Grammar in Use Book with Answers', N'Martin Hewings', 10, 125000, 178000, N'G2-18', 19, 48);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000019', N'Oxford Learner''s Pocket Word Skills', N'Oxford University Press', 10, 176000, 252000, N'G2-19', 15, 49);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000020', N'The Fault In Our Stars', N'John Green', 2, 153000, 218000, N'A3-20', 11, 50);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000021', N'Thinking, Fast and Slow', N'Daniel Kahneman', 9, 319000, 456000, N'F2-21', 7, 51);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000022', N'Complete IELTS B2 Workbook', N'Guy Brook-Hart', 10, 77000, 110000, N'G2-22', 44, 52);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000023', N'The Godfather', N'Mario Puzo', 2, 219000, 313000, N'A3-23', 40, 53);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000024', N'Oxford Learner''s Pocket Grammar', N'Oxford University Press', 10, 91000, 130000, N'G2-24', 36, 54);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000025', N'The Five People You Meet in Heaven', N'Mitch Albom', 2, 185000, 264000, N'A3-25', 32, 55);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000026', N'Complete IELTS B1 Workbook', N'Guy Brook-Hart', 10, 77000, 110000, N'G2-26', 28, 56);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000027', N'P.S. I Still Love You', N'Jenny Han', 2, 233000, 333000, N'A3-27', 24, 57);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000028', N'Diary Of A Wimpy Kid 2: Rodrick Rules', N'Jeff Kinney', 5, 123000, 176000, N'B2-28', 20, 58);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000029', N'1Q84 Books 1, 2 & 3', N'Haruki Murakami', 2, 329000, 470000, N'A3-29', 16, 59);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000030', N'The Da Vinci Code', N'Dan Brown', 2, 197000, 282000, N'A3-30', 12, 60);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000031', N'The Great Gatsby', N'F. Scott Fitzgerald', 2, 88000, 126000, N'A3-01', 8, 61);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000032', N'Complete IELTS B1 Student''s Book', N'Guy Brook-Hart', 10, 195000, 279000, N'G2-02', 45, 62);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000033', N'The 4-Hour Work Week', N'Timothy Ferriss', 4, 373000, 533000, N'C4-03', 41, 63);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000034', N'English Vocabulary in Use: Upper-Intermediate', N'Michael McCarthy', 10, 135000, 193000, N'G2-04', 37, 64);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000035', N'Diary Of A Wimpy Kid 5: The Ugly Truth', N'Jeff Kinney', 5, 123000, 176000, N'B2-05', 33, 65);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000036', N'Good to Great', N'Jim Collins', 3, 570000, 815000, N'C3-06', 29, 66);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000037', N'Complete IELTS Bands 6.5-7.5 Student''s Book', N'Guy Brook-Hart', 10, 195000, 279000, N'G2-07', 25, 67);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000038', N'English Vocabulary in Use: Pre-Intermediate and Intermediate', N'Stuart Redman', 10, 135000, 193000, N'G2-08', 21, 68);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000039', N'Charlotte''s Web', N'E. B. White', 5, 181000, 258000, N'B2-09', 17, 69);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000040', N'The Book Thief', N'Markus Zusak', 2, 132000, 188000, N'A3-10', 13, 70);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000041', N'English Vocabulary in Use: Elementary', N'Michael McCarthy', 10, 94000, 134000, N'G2-11', 9, 71);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000042', N'Complete IELTS Bands 6.5-7.5 Workbook', N'Guy Brook-Hart', 10, 77000, 110000, N'G2-12', 5, 72);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000043', N'Freakonomics', N'Steven D. Levitt, Stephen J. Dubner', 3, 147000, 210000, N'C3-13', 42, 73);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000044', N'A Brief History of Time', N'Stephen Hawking', 6, 241000, 344000, N'D3-14', 38, 74);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000045', N'Diary Of A Wimpy Kid 9: The Long Haul', N'Jeff Kinney', 5, 123000, 176000, N'B2-15', 34, 75);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000046', N'American Gods', N'Neil Gaiman', 2, 128000, 183000, N'A3-16', 30, 76);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000047', N'Harry Potter - A History of Magic', N'British Library', 5, 539000, 770000, N'B2-17', 26, 77);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000048', N'Einstein: His Life and Universe', N'Walter Isaacson', 6, 337000, 481000, N'D3-18', 22, 78);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000049', N'Sputnik Sweetheart', N'Haruki Murakami', 2, 186000, 266000, N'A3-19', 18, 79);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000050', N'Angels and Demons', N'Dan Brown', 2, 162000, 232000, N'A3-20', 14, 80);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000051', N'Diary of a Wimpy Kid 8: Hard Luck', N'Jeff Kinney', 5, 123000, 176000, N'B2-21', 10, 81);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000052', N'How To Win Friends And Influence People', N'Dale Carnegie', 4, 162000, 232000, N'C4-22', 6, 82);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000053', N'Diary Of A Wimpy Kid 7: The Third Wheel', N'Jeff Kinney', 5, 123000, 176000, N'B2-23', 43, 83);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000054', N'The Wealth Of Nations', N'Adam Smith', 3, 129000, 184000, N'C3-24', 39, 84);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000055', N'Colorless Tsukuru Tazaki and His Years of Pilgrimage', N'Haruki Murakami', 2, 181000, 258000, N'A3-25', 35, 85);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000056', N'Outliers: The Story Of Success', N'Malcolm Gladwell', 4, 165000, 236000, N'C4-26', 31, 86);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000057', N'Diary Of A Wimpy Kid 6: Cabin Fever', N'Jeff Kinney', 5, 123000, 176000, N'B2-27', 27, 87);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000058', N'Never Eat Alone', N'Keith Ferrazzi', 4, 227000, 324000, N'C4-28', 23, 88);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000059', N'Built to Last', N'Jim Collins, Jerry I. Porras', 3, 538000, 768000, N'C3-29', 19, 89);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000060', N'How Not to be Wrong', N'Jordan Ellenberg', 6, 268000, 383000, N'D3-30', 15, 90);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000061', N'Leadership', N'Colin Powell', 3, 132000, 188000, N'C3-01', 11, 91);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000062', N'Trump: How to Get Rich', N'Donald J. Trump', 3, 147000, 210000, N'C3-02', 7, 92);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000063', N'Trump: The Art Of The Deal', N'Donald J. Trump', 3, 141000, 202000, N'C3-03', 44, 93);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000064', N'Management 101', N'Bob Adams', 3, 277000, 396000, N'C3-04', 40, 94);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000065', N'Think and Grow Rich', N'Napoleon Hill', 3, 179000, 256000, N'C3-05', 36, 95);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000066', N'The Communication Book', N'Mikael Krogerus, Roman Tschäppeler', 4, 228000, 325000, N'C4-06', 32, 96);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000067', N'Blink: The Power of Thinking Without Thinking', N'Malcolm Gladwell', 9, 165000, 236000, N'F2-07', 28, 97);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000068', N'The Lean Startup', N'Eric Ries', 3, 212000, 303000, N'C3-08', 24, 98);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000069', N'Misbehaving: The Making of Behavioural Economics', N'Richard H. Thaler', 3, 260000, 371000, N'C3-09', 20, 99);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000070', N'Negotiation Genius', N'Deepak Malhotra, Max H. Bazerman', 3, 293000, 419000, N'C3-10', 16, 100);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000071', N'The Black Swan', N'Nassim Nicholas Taleb', 3, 276000, 395000, N'C3-11', 12, 101);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000072', N'The Master Algorithm', N'Pedro Domingos', 8, 234000, 334000, N'E2-12', 8, 102);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000073', N'Grit: The Power of Passion and Perseverance', N'Angela Duckworth', 9, 268000, 383000, N'F2-13', 45, 103);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000074', N'Elon Musk', N'Ashlee Vance', 3, 181000, 258000, N'C3-14', 41, 104);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000075', N'Whatever You Think, Think The Opposite', N'Paul Arden', 4, 234000, 334000, N'C4-15', 37, 105);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000076', N'The Greatest Salesman In The World', N'Og Mandino', 4, 163000, 233000, N'C4-16', 33, 106);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000077', N'Creativity, Inc.', N'Ed Catmull', 3, 307000, 439000, N'C3-17', 29, 107);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000078', N'Contagious: Why Things Catch On', N'Jonah Berger', 3, 254000, 363000, N'C3-18', 25, 108);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000079', N'The Economics Book (Big Ideas)', N'DK', 3, 472000, 674000, N'C3-19', 21, 109);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000080', N'Why Nations Fail', N'Daron Acemoglu, James A. Robinson', 7, 265000, 379000, N'D4-20', 17, 110);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000081', N'You Are a Badass at Making Money', N'Jen Sincero', 4, 225000, 321000, N'C4-21', 13, 111);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000082', N'Start With Why', N'Simon Sinek', 3, 220000, 314000, N'C3-22', 9, 112);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000083', N'The $100 Startup', N'Chris Guillebeau', 3, 212000, 303000, N'C3-23', 5, 113);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000084', N'Hooked: How to Build Habit-Forming Products', N'Nir Eyal', 8, 319000, 456000, N'E2-24', 42, 114);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000085', N'Tools Of Titans', N'Timothy Ferriss', 4, 517000, 739000, N'C4-25', 38, 115);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000086', N'Getting To Yes', N'Roger Fisher, William Ury', 4, 192000, 274000, N'C4-26', 34, 116);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000087', N'Getting Things Done', N'David Allen', 4, 309000, 442000, N'C4-27', 30, 117);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000088', N'Make Time: How To Focus On What Matters Every Day', N'Jake Knapp, John Zeratsky', 4, 326000, 465000, N'C4-28', 26, 118);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000089', N'Start-Up Nation', N'Dan Senor, Saul Singer', 3, 245000, 350000, N'C3-29', 22, 119);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000090', N'What the Dog Saw', N'Malcolm Gladwell', 9, 196000, 280000, N'F2-30', 18, 120);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000091', N'Never Split the Difference', N'Chris Voss', 4, 252000, 360000, N'C4-01', 14, 121);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000092', N'Think Like a Freak', N'Steven D. Levitt, Stephen J. Dubner', 3, 182000, 260000, N'C3-02', 10, 122);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000093', N'The New One Minute Manager', N'Ken Blanchard, Spencer Johnson', 3, 126000, 180000, N'C3-03', 6, 123);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000094', N'Unshakeable', N'Tony Robbins', 3, 238000, 340000, N'C3-04', 43, 124);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000095', N'The Essential Drucker', N'Peter F. Drucker', 3, 224000, 320000, N'C3-05', 39, 125);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000096', N'18 Minutes', N'Peter Bregman', 4, 203000, 290000, N'C4-06', 35, 126);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000097', N'Jumpstart Your Leadership', N'John C. Maxwell', 4, 175000, 250000, N'C4-07', 31, 127);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000098', N'Auggie & Me: Three Wonder Stories', N'R. J. Palacio', 5, 147000, 210000, N'B2-08', 27, 128);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
SET IDENTITY_INSERT [dbo].[Sach] ON;
INSERT INTO [dbo].[Sach] ([isbn], [tenSach], [tacGia], [maTL], [giaNhap], [giaBan], [viTriKe], [soLuongTon], [maSach]) VALUES (N'9786049000099', N'The Wolf of Wall Street', N'Jordan Belfort', 3, 210000, 300000, N'C3-09', 23, 129);
SET IDENTITY_INSERT [dbo].[Sach] OFF;
UPDATE [dbo].[Sach] SET [trangThai] = N'NGUNG_KINH_DOANH' WHERE [maSach] = 30;
SET IDENTITY_INSERT [dbo].[KhachHang] ON;
INSERT INTO [dbo].[KhachHang] ([soDienThoai], [hoTen], [email], [diaChi], [diemHienTai], [diemTichLuy], [maHang], [maKH]) VALUES (N'0911111111', N'Trần Thị Mai', N'mai@gmail.com', N'Quận 5, TP.HCM', 120, 320, 1, 1);
SET IDENTITY_INSERT [dbo].[KhachHang] OFF;
SET IDENTITY_INSERT [dbo].[KhachHang] ON;
INSERT INTO [dbo].[KhachHang] ([soDienThoai], [hoTen], [email], [diaChi], [diemHienTai], [diemTichLuy], [maHang], [maKH]) VALUES (N'0922222222', N'Phạm Văn Nam', N'nam@gmail.com', N'Quận 10, TP.HCM', 450, 850, 2, 2);
SET IDENTITY_INSERT [dbo].[KhachHang] OFF;
SET IDENTITY_INSERT [dbo].[KhachHang] ON;
INSERT INTO [dbo].[KhachHang] ([soDienThoai], [hoTen], [diaChi], [diemHienTai], [diemTichLuy], [maHang], [maKH]) VALUES (N'0933333333', N'Lê Thu Hà', N'Quận 1, TP.HCM', 1500, 2600, 3, 3);
SET IDENTITY_INSERT [dbo].[KhachHang] OFF;
SET IDENTITY_INSERT [dbo].[KhachHang] ON;
INSERT INTO [dbo].[KhachHang] ([soDienThoai], [hoTen], [email], [diemHienTai], [diemTichLuy], [maHang], [maKH]) VALUES (N'0944444444', N'Đỗ Minh Khoa', N'khoa@gmail.com', 30, 30, 1, 4);
SET IDENTITY_INSERT [dbo].[KhachHang] OFF;
SET IDENTITY_INSERT [dbo].[KhachHang] ON;
INSERT INTO [dbo].[KhachHang] ([soDienThoai], [hoTen], [diaChi], [diemHienTai], [diemTichLuy], [maHang], [maKH]) VALUES (N'0955555555', N'Hoàng Gia Linh', N'Thủ Đức, TP.HCM', 600, 1200, 2, 5);
SET IDENTITY_INSERT [dbo].[KhachHang] OFF;
SET IDENTITY_INSERT [dbo].[KhachHang] ON;
INSERT INTO [dbo].[KhachHang] ([soDienThoai], [hoTen], [diemHienTai], [diemTichLuy], [maHang], [maKH]) VALUES (N'0966666666', N'Vũ Ngọc Anh', 0, 0, 1, 6);
SET IDENTITY_INSERT [dbo].[KhachHang] OFF;
SET IDENTITY_INSERT [dbo].[KhachHang] ON;
INSERT INTO [dbo].[KhachHang] ([soDienThoai], [hoTen], [email], [diemHienTai], [diemTichLuy], [maHang], [maKH]) VALUES (N'0977777777', N'Ngô Quốc Bảo', N'bao.ngo@gmail.com', 2100, 3400, 3, 7);
SET IDENTITY_INSERT [dbo].[KhachHang] OFF;
SET IDENTITY_INSERT [dbo].[KhachHang] ON;
INSERT INTO [dbo].[KhachHang] ([soDienThoai], [hoTen], [diaChi], [diemHienTai], [diemTichLuy], [maHang], [maKH]) VALUES (N'0988888888', N'Bùi Thanh Tâm', N'Bình Thạnh, TP.HCM', 75, 175, 1, 8);
SET IDENTITY_INSERT [dbo].[KhachHang] OFF;
SET IDENTITY_INSERT [dbo].[NhaCungCap] ON;
INSERT INTO [dbo].[NhaCungCap] ([tenNCC], [diaChi], [maSoThue], [nguoiLienHe], [soDienThoai], [maNCC]) VALUES (N'Công ty TNHH Phát hành sách Fahasa', N'60-62 Lê Lợi, Quận 1, TP.HCM', N'0304132047', N'Nguyễn Văn Hùng', N'02838225796', 1);
SET IDENTITY_INSERT [dbo].[NhaCungCap] OFF;
SET IDENTITY_INSERT [dbo].[NhaCungCap] ON;
INSERT INTO [dbo].[NhaCungCap] ([tenNCC], [diaChi], [maSoThue], [nguoiLienHe], [soDienThoai], [maNCC]) VALUES (N'Nhà xuất bản Trẻ', N'161B Lý Chính Thắng, Quận 3, TP.HCM', N'0301234567', N'Trần Thị Lan', N'02839316289', 2);
SET IDENTITY_INSERT [dbo].[NhaCungCap] OFF;
SET IDENTITY_INSERT [dbo].[NhaCungCap] ON;
INSERT INTO [dbo].[NhaCungCap] ([tenNCC], [diaChi], [maSoThue], [nguoiLienHe], [soDienThoai], [maNCC]) VALUES (N'Công ty CP Sách Alpha', N'Hà Nội', N'0102345678', N'Phạm Đức Minh', N'02437226234', 3);
SET IDENTITY_INSERT [dbo].[NhaCungCap] OFF;
SET IDENTITY_INSERT [dbo].[NhaCungCap] ON;
INSERT INTO [dbo].[NhaCungCap] ([tenNCC], [diaChi], [maSoThue], [nguoiLienHe], [soDienThoai], [trangThaiHopTac], [maNCC]) VALUES (N'Nhà sách Phương Nam', N'Quận 3, TP.HCM', N'0303456789', N'Lý Hoàng Yến', N'02838220000', N'NGUNG_GIAO_DICH', 4);
SET IDENTITY_INSERT [dbo].[NhaCungCap] OFF;
SET IDENTITY_INSERT [dbo].[MaGiamGia] ON;
INSERT INTO [dbo].[MaGiamGia] ([maCode], [loaiGiam], [giaTriGiam], [giaTriDonToiThieu], [soLuongToiDa], [daSuDung], [ngayBatDau], [ngayKetThuc], [maMGG]) VALUES (N'GIAM10', N'PHAN_TRAM', 10, 200000, 100, 12, '2026-10-24T03:00:00.000', '2027-01-22T03:00:00.000', 1);
SET IDENTITY_INSERT [dbo].[MaGiamGia] OFF;
SET IDENTITY_INSERT [dbo].[MaGiamGia] ON;
INSERT INTO [dbo].[MaGiamGia] ([maCode], [loaiGiam], [giaTriGiam], [giaTriDonToiThieu], [soLuongToiDa], [daSuDung], [ngayBatDau], [ngayKetThuc], [maMGG]) VALUES (N'GIAM50K', N'SO_TIEN', 50000, 300000, 50, 5, '2026-11-13T03:00:00.000', '2026-12-23T03:00:00.000', 2);
SET IDENTITY_INSERT [dbo].[MaGiamGia] OFF;
SET IDENTITY_INSERT [dbo].[MaGiamGia] ON;
INSERT INTO [dbo].[MaGiamGia] ([maCode], [loaiGiam], [giaTriGiam], [giaTriDonToiThieu], [soLuongToiDa], [daSuDung], [ngayBatDau], [ngayKetThuc], [maMGG]) VALUES (N'SINHVIEN', N'PHAN_TRAM', 15, 0, 200, 0, '2026-11-22T03:00:00.000', '2027-02-21T03:00:00.000', 3);
SET IDENTITY_INSERT [dbo].[MaGiamGia] OFF;
SET IDENTITY_INSERT [dbo].[MaGiamGia] ON;
INSERT INTO [dbo].[MaGiamGia] ([maCode], [loaiGiam], [giaTriGiam], [giaTriDonToiThieu], [soLuongToiDa], [daSuDung], [ngayBatDau], [ngayKetThuc], [maMGG]) VALUES (N'TET2026', N'SO_TIEN', 30000, 150000, 100, 100, '2026-01-27T03:00:00.000', '2026-03-18T03:00:00.000', 4);
SET IDENTITY_INSERT [dbo].[MaGiamGia] OFF;
SET IDENTITY_INSERT [dbo].[MaGiamGia] ON;
INSERT INTO [dbo].[MaGiamGia] ([maCode], [loaiGiam], [giaTriGiam], [giaTriDonToiThieu], [soLuongToiDa], [daSuDung], [ngayBatDau], [ngayKetThuc], [maMGG]) VALUES (N'HETLUOT', N'PHAN_TRAM', 20, 0, 10, 10, '2026-11-18T03:00:00.000', '2026-11-28T03:00:00.000', 5);
SET IDENTITY_INSERT [dbo].[MaGiamGia] OFF;
SET IDENTITY_INSERT [dbo].[Combo] ON;
INSERT INTO [dbo].[Combo] ([tenCombo], [giaCombo], [ngayBatDau], [ngayKetThuc], [maCombo]) VALUES (N'Combo Nguyễn Nhật Ánh', 175000, '2026-11-16T03:00:00.000', '2026-12-23T03:00:00.000', 1);
SET IDENTITY_INSERT [dbo].[Combo] OFF;
INSERT INTO [dbo].[ChiTietCombo] ([maCombo], [maSach], [soLuong]) VALUES (1, 1, 1);
INSERT INTO [dbo].[ChiTietCombo] ([maCombo], [maSach], [soLuong]) VALUES (1, 2, 1);
SET IDENTITY_INSERT [dbo].[HoaDon] ON;
INSERT INTO [dbo].[HoaDon] ([maTK], [thoiGianTao], [trangThai], [tamTinh], [giamHangThe], [thueVAT], [tongTien], [phuongThucTT], [tienKhachDua], [maHD]) VALUES (2, '2026-11-17T08:00:00.000', N'DA_THANH_TOAN', 286000, 0, 14300, 300300, N'TIEN_MAT', 350000, 1);
SET IDENTITY_INSERT [dbo].[HoaDon] OFF;
INSERT INTO [dbo].[ChiTietHoaDon] ([maHD], [maSach], [soLuong], [donGiaBan], [thanhTien]) VALUES (1, 1, 1, 110000, 110000);
INSERT INTO [dbo].[ChiTietHoaDon] ([maHD], [maSach], [soLuong], [donGiaBan], [thanhTien]) VALUES (1, 13, 2, 88000, 176000);
SET IDENTITY_INSERT [dbo].[HoaDon] ON;
INSERT INTO [dbo].[HoaDon] ([maTK], [maKH], [thoiGianTao], [trangThai], [tamTinh], [giamHangThe], [thueVAT], [tongTien], [phuongThucTT], [tienKhachDua], [maHD]) VALUES (3, 2, '2026-11-18T07:00:00.000', N'DA_THANH_TOAN', 154000, 7700, 7315, 153615, N'MA_QR', 153615, 2);
SET IDENTITY_INSERT [dbo].[HoaDon] OFF;
INSERT INTO [dbo].[ChiTietHoaDon] ([maHD], [maSach], [soLuong], [donGiaBan], [thanhTien]) VALUES (2, 6, 1, 79000, 79000);
INSERT INTO [dbo].[ChiTietHoaDon] ([maHD], [maSach], [soLuong], [donGiaBan], [thanhTien]) VALUES (2, 16, 3, 25000, 75000);
SET IDENTITY_INSERT [dbo].[HoaDon] ON;
INSERT INTO [dbo].[HoaDon] ([maTK], [thoiGianTao], [trangThai], [tamTinh], [giamHangThe], [thueVAT], [tongTien], [phuongThucTT], [tienKhachDua], [maHD]) VALUES (2, '2026-11-19T06:00:00.000', N'DA_THANH_TOAN', 219000, 0, 10950, 229950, N'QUET_THE', 229950, 3);
SET IDENTITY_INSERT [dbo].[HoaDon] OFF;
INSERT INTO [dbo].[ChiTietHoaDon] ([maHD], [maSach], [soLuong], [donGiaBan], [thanhTien]) VALUES (3, 21, 1, 219000, 219000);
SET IDENTITY_INSERT [dbo].[HoaDon] ON;
INSERT INTO [dbo].[HoaDon] ([maTK], [maKH], [thoiGianTao], [trangThai], [tamTinh], [giamHangThe], [thueVAT], [tongTien], [phuongThucTT], [tienKhachDua], [maHD]) VALUES (2, 3, '2026-11-20T05:00:00.000', N'DA_THANH_TOAN', 300000, 30000, 13500, 283500, N'TIEN_MAT', 300000, 4);
SET IDENTITY_INSERT [dbo].[HoaDon] OFF;
INSERT INTO [dbo].[ChiTietHoaDon] ([maHD], [maSach], [soLuong], [donGiaBan], [thanhTien]) VALUES (4, 10, 1, 120000, 120000);
INSERT INTO [dbo].[ChiTietHoaDon] ([maHD], [maSach], [soLuong], [donGiaBan], [thanhTien]) VALUES (4, 11, 1, 105000, 105000);
INSERT INTO [dbo].[ChiTietHoaDon] ([maHD], [maSach], [soLuong], [donGiaBan], [thanhTien]) VALUES (4, 14, 1, 75000, 75000);
SET IDENTITY_INSERT [dbo].[HoaDon] ON;
INSERT INTO [dbo].[HoaDon] ([maTK], [thoiGianTao], [trangThai], [tamTinh], [giamHangThe], [thueVAT], [tongTien], [phuongThucTT], [tienKhachDua], [maHD]) VALUES (3, '2026-11-21T04:00:00.000', N'DA_THANH_TOAN', 420000, 0, 21000, 441000, N'TIEN_MAT', 450000, 5);
SET IDENTITY_INSERT [dbo].[HoaDon] OFF;
INSERT INTO [dbo].[ChiTietHoaDon] ([maHD], [maSach], [soLuong], [donGiaBan], [thanhTien]) VALUES (5, 24, 1, 280000, 280000);
INSERT INTO [dbo].[ChiTietHoaDon] ([maHD], [maSach], [soLuong], [donGiaBan], [thanhTien]) VALUES (5, 25, 1, 140000, 140000);
SET IDENTITY_INSERT [dbo].[HoaDon] ON;
INSERT INTO [dbo].[HoaDon] ([maTK], [thoiGianTao], [trangThai], [tamTinh], [giamHangThe], [thueVAT], [tongTien], [phuongThucTT], [tienKhachDua], [maHD]) VALUES (2, '2026-11-22T03:00:00.000', N'DA_THANH_TOAN', 216000, 0, 10800, 226800, N'MA_QR', 226800, 6);
SET IDENTITY_INSERT [dbo].[HoaDon] OFF;
INSERT INTO [dbo].[ChiTietHoaDon] ([maHD], [maSach], [soLuong], [donGiaBan], [thanhTien]) VALUES (6, 17, 4, 25000, 100000);
INSERT INTO [dbo].[ChiTietHoaDon] ([maHD], [maSach], [soLuong], [donGiaBan], [thanhTien]) VALUES (6, 4, 2, 58000, 116000);
SET IDENTITY_INSERT [dbo].[HoaDon] ON;
INSERT INTO [dbo].[HoaDon] ([maTK], [maKH], [thoiGianTao], [trangThai], [tamTinh], [giamHangThe], [thueVAT], [tongTien], [phuongThucTT], [tienKhachDua], [maHD]) VALUES (3, 1, '2026-11-23T01:47:39.339', N'DA_THANH_TOAN', 350000, 0, 17500, 367500, N'TIEN_MAT', 400000, 7);
SET IDENTITY_INSERT [dbo].[HoaDon] OFF;
INSERT INTO [dbo].[ChiTietHoaDon] ([maHD], [maSach], [soLuong], [donGiaBan], [thanhTien]) VALUES (7, 7, 1, 145000, 145000);
INSERT INTO [dbo].[ChiTietHoaDon] ([maHD], [maSach], [soLuong], [donGiaBan], [thanhTien]) VALUES (7, 27, 1, 205000, 205000);
SET IDENTITY_INSERT [dbo].[PhieuNhap] ON;
INSERT INTO [dbo].[PhieuNhap] ([maNCC], [maTKLap], [maTKDuyet], [ngayLap], [ngayDuyet], [trangThai], [tongTien], [ghiChu], [maPN]) VALUES (2, 2, 1, '2026-11-15T03:00:00.000', '2026-11-16T03:00:00.000', N'DA_DUYET', 2500000, N'Nhập bổ sung sách Nguyễn Nhật Ánh', 1);
SET IDENTITY_INSERT [dbo].[PhieuNhap] OFF;
INSERT INTO [dbo].[ChiTietPhieuNhap] ([maPN], [maSach], [soLuong], [giaNhap]) VALUES (1, 1, 20, 70000);
INSERT INTO [dbo].[ChiTietPhieuNhap] ([maPN], [maSach], [soLuong], [giaNhap]) VALUES (1, 2, 20, 55000);
SET IDENTITY_INSERT [dbo].[PhieuNhap] ON;
INSERT INTO [dbo].[PhieuNhap] ([maNCC], [maTKLap], [ngayLap], [trangThai], [tongTien], [ghiChu], [maPN]) VALUES (1, 3, '2026-11-23T01:00:00.000', N'CHO_DUYET', 1000000, N'Nhập sách sắp hết', 2);
SET IDENTITY_INSERT [dbo].[PhieuNhap] OFF;
INSERT INTO [dbo].[ChiTietPhieuNhap] ([maPN], [maSach], [soLuong], [giaNhap]) VALUES (2, 18, 10, 40000);
INSERT INTO [dbo].[ChiTietPhieuNhap] ([maPN], [maSach], [soLuong], [giaNhap]) VALUES (2, 9, 15, 40000);
SET IDENTITY_INSERT [dbo].[PhieuKiemKe] ON;
INSERT INTO [dbo].[PhieuKiemKe] ([maTKLap], [trangThai], [ghiChu], [maPKK]) VALUES (2, N'CHO_DUYET', N'Kiểm kê kệ A1', 1);
SET IDENTITY_INSERT [dbo].[PhieuKiemKe] OFF;
INSERT INTO [dbo].[ChiTietKiemKe] ([maPKK], [maSach], [slHeThong], [slThucTe]) VALUES (1, 1, 40, 40);
INSERT INTO [dbo].[ChiTietKiemKe] ([maPKK], [maSach], [slHeThong], [slThucTe], [lyDoChenhLech]) VALUES (1, 3, 20, 19, N'Thất lạc 1 cuốn');
SET IDENTITY_INSERT [dbo].[PhieuXuatHuy] ON;
INSERT INTO [dbo].[PhieuXuatHuy] ([maTKLap], [trangThai], [ghiChu], [maPXH]) VALUES (3, N'CHO_DUYET', N'Sách hư hỏng do ẩm', 1);
SET IDENTITY_INSERT [dbo].[PhieuXuatHuy] OFF;
INSERT INTO [dbo].[ChiTietXuatHuy] ([maPXH], [maSach], [soLuong], [lyDo]) VALUES (1, 4, 2, N'Bìa rách, ố vàng');
SET IDENTITY_INSERT [dbo].[NhatKyHeThong] ON;
INSERT INTO [dbo].[NhatKyHeThong] ([maTK], [module], [hanhDong], [noiDung], [maLog]) VALUES (1, N'HE_THONG', N'SEED', N'Khởi tạo dữ liệu mẫu', 1);
SET IDENTITY_INSERT [dbo].[NhatKyHeThong] OFF;
COMMIT;
GO
