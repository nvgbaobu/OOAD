import { TINH_TRANG_MA } from "@/lib/services/khuyenMaiService";
import type { TinhTrangMa } from "@/lib/repositories/maGiamGiaRepository";

const MAU: Record<TinhTrangMa, string> = {
  DANG_AP_DUNG: "bg-green-100 text-green-800", CHUA_BAT_DAU: "bg-blue-100 text-blue-800",
  HET_HAN: "bg-gray-200 text-gray-600", HET_LUOT: "bg-orange-100 text-orange-800", NGUNG: "bg-red-100 text-red-700",
};

export default function NhanTinhTrang({ t }: { t: TinhTrangMa }) {
  return <span className={`rounded px-1.5 py-0.5 text-xs whitespace-nowrap ${MAU[t]}`}>{TINH_TRANG_MA[t]}</span>;
}
