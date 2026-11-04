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
