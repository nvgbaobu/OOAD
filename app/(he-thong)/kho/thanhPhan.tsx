// Thành phần giao diện dùng chung cho các trang phiếu kho (server component).
import Link from "next/link";
import FormHanhDong from "@/app/components/FormHanhDong";
import { duyetPhieu, tuChoiPhieu, type LoaiPhieu } from "@/app/actions/kho";
import { TRANG_THAI_PHIEU, type TrangThaiPhieu } from "@/lib/services/khoService";
import { ngayGio } from "@/lib/dinhDang";

const MAU: Record<string, string> = {
  CHO_DUYET: "bg-yellow-100 text-yellow-800",
  DA_DUYET: "bg-green-100 text-green-800",
  TU_CHOI: "bg-red-100 text-red-700",
};

export function NhanTrangThai({ trangThai }: { trangThai: string }) {
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs whitespace-nowrap ${MAU[trangThai] ?? "bg-gray-100"}`}>
      {TRANG_THAI_PHIEU[trangThai as TrangThaiPhieu] ?? trangThai}
    </span>
  );
}

/** Đọc ?trangThai= hợp lệ. */
export const docTrangThai = (v: unknown) => (typeof v === "string" && v in TRANG_THAI_PHIEU ? (v as TrangThaiPhieu) : undefined);

export function LocTrangThai({ loai, hienTai }: { loai: LoaiPhieu; hienTai?: TrangThaiPhieu }) {
  const muc: [TrangThaiPhieu | undefined, string][] = [[undefined, "Tất cả"], ...Object.entries(TRANG_THAI_PHIEU) as [TrangThaiPhieu, string][]];
  return (
    <nav className="flex gap-1 text-sm">
      {muc.map(([k, ten]) => (
        <Link key={ten} href={k ? `/kho/${loai}?trangThai=${k}` : `/kho/${loai}`} aria-current={k === hienTai ? "page" : undefined}
          className={`rounded border px-2.5 py-1 ${k === hienTai ? "bg-blue-600 text-white" : "bg-white hover:bg-gray-50"}`}>
          {ten}
        </Link>
      ))}
    </nav>
  );
}

type PhieuChung = {
  trangThai: string; ngayLap: Date; ngayDuyet: Date | null; ghiChu: string | null; lyDoTuChoi: string | null;
  nguoiLap: { hoTen: string }; nguoiDuyet: { hoTen: string } | null;
};

export function ThongTinPhieu({ p }: { p: PhieuChung }) {
  return (
    <dl className="grid gap-x-6 gap-y-1 rounded-lg border bg-white p-4 text-sm sm:grid-cols-2">
      <div><dt className="inline text-gray-500">Trạng thái: </dt><dd className="inline"><NhanTrangThai trangThai={p.trangThai} /></dd></div>
      <div><dt className="inline text-gray-500">Người lập: </dt><dd className="inline">{p.nguoiLap.hoTen} – {ngayGio(p.ngayLap)}</dd></div>
      {p.nguoiDuyet && (
        <div><dt className="inline text-gray-500">{p.trangThai === "TU_CHOI" ? "Người từ chối" : "Người duyệt"}: </dt>
          <dd className="inline">{p.nguoiDuyet.hoTen}{p.ngayDuyet && ` – ${ngayGio(p.ngayDuyet)}`}</dd></div>
      )}
      {p.ghiChu && <div className="sm:col-span-2"><dt className="inline text-gray-500">Ghi chú: </dt><dd className="inline">{p.ghiChu}</dd></div>}
      {p.lyDoTuChoi && <div className="sm:col-span-2 text-red-700"><dt className="inline">Lý do từ chối: </dt><dd className="inline">{p.lyDoTuChoi}</dd></div>}
    </dl>
  );
}

/** Khối Duyệt / Từ chối – chỉ hiện cho Admin khi phiếu đang chờ duyệt. */
export function XuLyPhieu({ loai, ma, moTaDuyet }: { loai: LoaiPhieu; ma: number; moTaDuyet: string }) {
  return (
    <div className="flex flex-wrap items-start gap-4 rounded-lg border border-yellow-300 bg-yellow-50 p-4">
      <FormHanhDong action={duyetPhieu.bind(null, loai)} xacNhan={`Duyệt phiếu #${ma}? ${moTaDuyet}`} className="flex flex-col items-start gap-1">
        <input type="hidden" name="ma" value={ma} />
        <button className="rounded bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700">✔ Duyệt phiếu</button>
        <span className="text-xs text-gray-600">{moTaDuyet}</span>
      </FormHanhDong>
      <FormHanhDong action={tuChoiPhieu.bind(null, loai)} className="flex min-w-72 flex-1 flex-wrap gap-2">
        <input type="hidden" name="ma" value={ma} />
        <input name="lyDoTuChoi" required maxLength={500} placeholder="Lý do từ chối" className="flex-1 rounded border px-2 py-1 text-sm" />
        <button className="rounded border border-red-300 bg-white px-3 py-1 text-sm text-red-700 hover:bg-red-50">Từ chối</button>
      </FormHanhDong>
    </div>
  );
}
