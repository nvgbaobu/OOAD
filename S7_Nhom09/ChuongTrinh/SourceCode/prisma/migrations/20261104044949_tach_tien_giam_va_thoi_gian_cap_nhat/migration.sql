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
