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
