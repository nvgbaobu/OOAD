/**
 * Lỗi nghiệp vụ – thông điệp hiển thị thẳng cho người dùng.
 * loiTruong: lỗi theo từng ô nhập (tên ô = name của input) để form hiện ngay dưới ô.
 * Server action bắt lớp này và trả { loi, loiTruong }; lỗi khác cứ để ném ra.
 */
export class LoiNghiepVu extends Error {
  constructor(message: string, public loiTruong?: Record<string, string>) {
    super(message);
  }
}
