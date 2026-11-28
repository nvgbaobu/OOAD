// Lớp trừu tượng KhuyenMai – Bảng 3.53 (thuộc tính), Bảng 3.54 (phương thức).
// Lớp cha của MaGiamGia và Combo. Không có bảng riêng: thuộc tính chung (ngày áp dụng, trạng thái)
// được lặp lại trong bảng của từng lớp con (ánh xạ kế thừa "mỗi lớp con một bảng").
export type TrangThaiKM = "HOAT_DONG" | "NGUNG_HOAT_DONG";

export abstract class KhuyenMai {
  // ───── Thuộc tính ─────
  declare ngayBatDau: Date; // 0:00 ngày bắt đầu
  declare ngayKetThuc: Date; // 23:59:59 ngày kết thúc
  declare trangThai: string; // HOAT_DONG | NGUNG_HOAT_DONG

  constructor(duLieu: object) {
    Object.assign(this, duLieu);
  }

  // ───── Phương thức ─────

  /** Còn hiệu lực tại thời điểm `ngay`: đang hoạt động và nằm trong khoảng ngày áp dụng. */
  conHieuLuc(ngay: Date = new Date()): boolean {
    return this.trangThai === "HOAT_DONG" && ngay >= this.ngayBatDau && ngay <= this.ngayKetThuc;
  }
}
