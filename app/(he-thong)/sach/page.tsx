import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { sachService, TRANG_THAI_SACH } from "@/lib/services/sachService";
import { tienVND } from "@/lib/dinhDang";

export const metadata: Metadata = { title: "Quản lý sách" };

const oLoc = "rounded border px-2 py-1.5 text-sm";

export default async function TrangSach({ searchParams }: PageProps<"/sach">) {
  const nd = await yeuCauDangNhap("ADMIN", "STAFF"); // Staff chỉ xem để tra cứu
  const laAdmin = nd.vaiTro === "ADMIN";
  const sp = await searchParams;
  const chuoi = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : "");
  const loc = {
    tuKhoa: chuoi("q"),
    maTL: Number(chuoi("maTL")) || undefined,
    trangThai: chuoi("trangThai") in TRANG_THAI_SACH ? chuoi("trangThai") : undefined,
    sapHet: chuoi("sapHet") === "1",
  };
  const [{ sachs, tong, soTrang, trang }, theLoais] = await Promise.all([
    sachService.danhSach(loc, Number(chuoi("trang")) || 1),
    sachService.danhSachTheLoai(),
  ]);
  const daLuu = Number(chuoi("daLuu")) || null;

  const linkTrang = (t: number) => {
    const p = new URLSearchParams(Object.entries(sp).filter(([k, v]) => typeof v === "string" && k !== "daLuu") as [string, string][]);
    p.set("trang", String(t));
    return `/sach?${p}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-lg font-semibold">Quản lý sách <span className="text-sm font-normal text-gray-500">({tong} đầu sách)</span></h1>
        {laAdmin && (
          <>
            <Link href="/sach/the-loai" className="rounded border bg-white px-3 py-1.5 text-sm hover:bg-gray-50">Thể loại &amp; VAT</Link>
            <Link href="/sach/them" className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">+ Thêm sách</Link>
          </>
        )}
      </div>

      {daLuu && <p role="status" className="rounded bg-green-50 px-3 py-2 text-sm text-green-800">✔ Đã lưu sách #{daLuu}.</p>}

      <Form action="/sach" replace className="flex flex-wrap gap-2 rounded-lg border bg-white p-3">
        <input name="q" defaultValue={loc.tuKhoa} placeholder="Tên sách, tác giả, ISBN..." className={`${oLoc} min-w-60 flex-1`} />
        <select name="maTL" defaultValue={loc.maTL ?? ""} className={oLoc}>
          <option value="">Tất cả thể loại</option>
          {theLoais.map((t) => <option key={t.maTL} value={t.maTL}>{t.tenTL}</option>)}
        </select>
        <select name="trangThai" defaultValue={loc.trangThai ?? ""} className={oLoc}>
          <option value="">Mọi trạng thái</option>
          {Object.entries(TRANG_THAI_SACH).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" name="sapHet" value="1" defaultChecked={loc.sapHet} /> Sắp hết hàng
        </label>
        <button className="rounded bg-gray-800 px-3 py-1.5 text-sm text-white hover:bg-gray-700">Lọc</button>
        <Link href="/sach" className="px-2 py-1.5 text-sm text-gray-600 hover:underline">Xóa lọc</Link>
      </Form>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[1000px] text-sm [&_td]:px-2 [&_td]:whitespace-nowrap [&_td:first-child]:whitespace-normal [&_th]:px-2 [&_th]:whitespace-nowrap">
          <thead className="border-b bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-3 py-2">Sách</th>
              <th>Thể loại</th>
              <th className="text-right">Giá nhập</th>
              <th className="text-right">Giá bán</th>
              <th className="text-right" title="Tồn kho thực tế">Tồn</th>
              <th className="text-right" title="Đang nằm trong đơn chưa thanh toán">Tạm giữ</th>
              <th className="text-right">Còn bán</th>
              <th className="pl-3">Kệ</th>
              <th>Trạng thái</th>
              {laAdmin && <th />}
            </tr>
          </thead>
          <tbody>
            {sachs.map((s) => {
              const sapHet = s.soLuongTon <= s.dinhMucToiThieu;
              return (
                <tr key={s.maSach} className={`border-b last:border-0 ${s.maSach === daLuu ? "bg-green-50" : ""} ${s.trangThai !== "DANG_BAN" ? "text-gray-400" : ""}`}>
                  <td className="px-3 py-2">
                    <div className="font-medium">{s.tenSach}</div>
                    <div className="text-xs text-gray-500">{s.tacGia} · ISBN {s.isbn}{s.namXB ? ` · ${s.namXB}` : ""}</div>
                  </td>
                  <td className="text-xs">{s.theLoai.tenTL}</td>
                  <td className="text-right">{tienVND(s.giaNhap)}</td>
                  <td className="text-right">{tienVND(s.giaBan)}</td>
                  <td className={`text-right ${sapHet ? "font-semibold text-orange-600" : ""}`} title={sapHet ? `Dưới định mức ${s.dinhMucToiThieu}` : undefined}>
                    {s.soLuongTon}{sapHet && " ⚠"}
                  </td>
                  <td className="text-right">{s.soLuongTamGiu || "–"}</td>
                  <td className="text-right">{s.soLuongTon - s.soLuongTamGiu}</td>
                  <td className="pl-3">{s.viTriKe ?? "–"}</td>
                  <td>
                    <span className={`rounded px-1.5 py-0.5 text-xs ${s.trangThai === "DANG_BAN" ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}`}>
                      {TRANG_THAI_SACH[s.trangThai as keyof typeof TRANG_THAI_SACH] ?? s.trangThai}
                    </span>
                  </td>
                  {laAdmin && (
                    <td className="pr-3 text-right">
                      <Link href={`/sach/${s.maSach}`} className="text-blue-600 hover:underline">Sửa</Link>
                    </td>
                  )}
                </tr>
              );
            })}
            {sachs.length === 0 && (
              <tr><td colSpan={10} className="py-8 text-center text-gray-500">Không có sách phù hợp</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {soTrang > 1 && (
        <nav className="flex items-center justify-center gap-1 text-sm">
          {Array.from({ length: soTrang }, (_, i) => i + 1).map((t) => (
            <Link key={t} href={linkTrang(t)} aria-current={t === trang ? "page" : undefined}
              className={`rounded border px-2.5 py-1 ${t === trang ? "bg-blue-600 text-white" : "bg-white hover:bg-gray-50"}`}>
              {t}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
