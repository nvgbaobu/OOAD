// Định dạng hiển thị dùng chung
export const tienVND = (n: number | string | { toString(): string }) => `${Number(n).toLocaleString("vi-VN")}đ`;
export const ngayGio = (d: Date) =>
  d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
export const gioPhut = (d: Date) => d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
