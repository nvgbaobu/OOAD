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
