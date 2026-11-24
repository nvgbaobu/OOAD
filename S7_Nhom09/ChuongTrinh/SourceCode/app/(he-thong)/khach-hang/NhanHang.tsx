const MAU: Record<string, string> = {
  "Đồng": "bg-orange-100 text-orange-800", "Bạc": "bg-gray-200 text-gray-700", "Vàng": "bg-yellow-100 text-yellow-800",
};

/** Huy hiệu hạng thành viên (hạng do Admin thêm mới dùng màu xanh). */
export default function NhanHang({ tenHang }: { tenHang: string }) {
  return <span className={`rounded px-1.5 py-0.5 text-xs whitespace-nowrap ${MAU[tenHang] ?? "bg-blue-100 text-blue-800"}`}>{tenHang}</span>;
}
