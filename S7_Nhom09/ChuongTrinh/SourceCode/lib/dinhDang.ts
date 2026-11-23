// Định dạng hiển thị dùng chung
export const tienVND = (n: number | string | { toString(): string }) => `${Number(n).toLocaleString("vi-VN")}đ`;
export const ngayGio = (d: Date) =>
  d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
export const gioPhut = (d: Date) => d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
export const ngay = (d: Date) => d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
/** Date → "YYYY-MM-DD" theo giờ địa phương (giá trị cho <input type="date">). */
export const ngayInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
/** "YYYY-MM-DD" → Date đầu ngày (cuoiNgay = 23:59:59.999) theo giờ địa phương; sai định dạng → null. */
export function docNgayInput(s: string, cuoiNgay = false): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const d = cuoiNgay ? new Date(+m[1], +m[2] - 1, +m[3], 23, 59, 59, 999) : new Date(+m[1], +m[2] - 1, +m[3]);
  return d.getMonth() === +m[2] - 1 ? d : null; // loại ngày không tồn tại (vd 31/02)
}
