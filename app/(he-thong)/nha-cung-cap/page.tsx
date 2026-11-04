import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { nhaCungCapService, TRANG_THAI_NCC } from "@/lib/services/nhaCungCapService";

export const metadata: Metadata = { title: "Nhà cung cấp" };

const oLoc = "rounded border px-2 py-1.5 text-sm";

export default async function TrangNhaCungCap({ searchParams }: PageProps<"/nha-cung-cap">) {
  await yeuCauDangNhap("ADMIN");
  const sp = await searchParams;
  const chuoi = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : "");
  const loc = { tuKhoa: chuoi("q"), trangThai: chuoi("trangThai") in TRANG_THAI_NCC ? chuoi("trangThai") : undefined };
  const ds = await nhaCungCapService.danhSach(loc);
  const daLuu = Number(chuoi("daLuu")) || null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-lg font-semibold">Nhà cung cấp <span className="text-sm font-normal text-gray-500">({ds.length})</span></h1>
        <Link href="/kho/phieu-nhap" className="rounded border bg-white px-3 py-1.5 text-sm hover:bg-gray-50">Phiếu nhập</Link>
        <Link href="/nha-cung-cap/them" className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">+ Thêm nhà cung cấp</Link>
      </div>
      {daLuu && <p role="status" className="rounded bg-green-50 px-3 py-2 text-sm text-green-800">✔ Đã lưu nhà cung cấp #{daLuu}.</p>}

      <Form action="/nha-cung-cap" replace className="flex flex-wrap gap-2 rounded-lg border bg-white p-3">
        <input name="q" defaultValue={loc.tuKhoa} placeholder="Tên, mã số thuế, SĐT, người liên hệ..." className={`${oLoc} min-w-60 flex-1`} />
        <select name="trangThai" defaultValue={loc.trangThai ?? ""} className={oLoc}>
          <option value="">Mọi trạng thái</option>
          {Object.entries(TRANG_THAI_NCC).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="rounded bg-gray-800 px-3 py-1.5 text-sm text-white hover:bg-gray-700">Lọc</button>
        <Link href="/nha-cung-cap" className="px-2 py-1.5 text-sm text-gray-600 hover:underline">Xóa lọc</Link>
      </Form>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[760px] text-sm [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:whitespace-nowrap">
          <thead className="border-b bg-gray-50 text-left text-gray-600">
            <tr><th className="py-2">Nhà cung cấp</th><th>Mã số thuế</th><th>Người liên hệ</th><th>Điện thoại</th><th className="text-right">Phiếu nhập</th><th>Trạng thái</th><th /></tr>
          </thead>
          <tbody>
            {ds.map((n) => (
              <tr key={n.maNCC} className={`border-b last:border-0 ${n.maNCC === daLuu ? "bg-green-50" : ""} ${n.trangThaiHopTac !== "DANG_GIAO_DICH" ? "text-gray-400" : ""}`}>
                <td><div className="font-medium">{n.tenNCC}</div><div className="text-xs text-gray-500">{n.diaChi}</div></td>
                <td>{n.maSoThue}</td>
                <td>{n.nguoiLienHe ?? "–"}</td>
                <td>{n.soDienThoai ?? "–"}</td>
                <td className="text-right">{n._count.phieuNhaps}</td>
                <td>
                  <span className={`rounded px-1.5 py-0.5 text-xs whitespace-nowrap ${n.trangThaiHopTac === "DANG_GIAO_DICH" ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}`}>
                    {TRANG_THAI_NCC[n.trangThaiHopTac as keyof typeof TRANG_THAI_NCC] ?? n.trangThaiHopTac}
                  </span>
                </td>
                <td className="text-right whitespace-nowrap"><Link href={`/nha-cung-cap/${n.maNCC}`} className="text-blue-600 hover:underline">Chi tiết</Link></td>
              </tr>
            ))}
            {ds.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-500">Không có nhà cung cấp phù hợp</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
