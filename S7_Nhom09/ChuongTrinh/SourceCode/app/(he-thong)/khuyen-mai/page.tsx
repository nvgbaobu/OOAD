import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { khuyenMaiService, TINH_TRANG_MA, tinhTrang } from "@/lib/services/khuyenMaiService";
import type { TinhTrangMa } from "@/lib/repositories/maGiamGiaRepository";
import { ngay, tienVND } from "@/lib/dinhDang";
import NhanTinhTrang from "./NhanTinhTrang";

export const metadata: Metadata = { title: "Khuyến mãi" };

const oLoc = "rounded border px-2 py-1.5 text-sm";

export default async function TrangKhuyenMai({ searchParams }: PageProps<"/khuyen-mai">) {
  const nd = await yeuCauDangNhap("ADMIN", "STAFF"); // Staff xem để tư vấn khách
  const laAdmin = nd.vaiTro === "ADMIN";
  const sp = await searchParams;
  const chuoi = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : "");
  const loc = {
    tuKhoa: chuoi("q").toUpperCase() || undefined,
    tinhTrang: chuoi("tinhTrang") in TINH_TRANG_MA ? (chuoi("tinhTrang") as TinhTrangMa) : undefined,
  };
  const [mas, combos] = await Promise.all([khuyenMaiService.danhSachMa(loc), khuyenMaiService.danhSachCombo()]);
  const daLuu = chuoi("daLuu");

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="mr-auto text-lg font-semibold">Mã giảm giá <span className="text-sm font-normal text-gray-500">({mas.length})</span></h1>
          {laAdmin && <Link href="/khuyen-mai/ma/them" className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">+ Thêm mã</Link>}
        </div>
        {daLuu && <p role="status" className="rounded bg-green-50 px-3 py-2 text-sm text-green-800">✔ Đã lưu mã {daLuu}.</p>}
        <Form action="/khuyen-mai" replace className="flex flex-wrap gap-2 rounded-lg border bg-white p-3">
          <input name="q" defaultValue={chuoi("q")} placeholder="Tìm mã..." className={`${oLoc} min-w-48 flex-1 uppercase`} />
          <select name="tinhTrang" defaultValue={loc.tinhTrang ?? ""} aria-label="Tình trạng" className={oLoc}>
            <option value="">Mọi tình trạng</option>
            {Object.entries(TINH_TRANG_MA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button className="rounded bg-gray-800 px-3 py-1.5 text-sm text-white hover:bg-gray-700">Lọc</button>
          <Link href="/khuyen-mai" className="px-2 py-1.5 text-sm text-gray-600 hover:underline">Xóa lọc</Link>
        </Form>
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full min-w-[820px] text-sm [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:whitespace-nowrap">
            <thead className="border-b bg-gray-50 text-left text-gray-600">
              <tr><th className="py-2">Mã</th><th>Mức giảm</th><th className="text-right">Đơn tối thiểu</th><th>Thời gian</th><th className="text-right">Đã dùng</th><th>Tình trạng</th>{laAdmin && <th />}</tr>
            </thead>
            <tbody>
              {mas.map((m) => {
                const t = tinhTrang(m);
                return (
                  <tr key={m.maMGG} className={`border-b last:border-0 ${t === "DANG_AP_DUNG" ? "" : "text-gray-500"} ${m.maCode === daLuu ? "bg-green-50" : ""}`}>
                    <td className="font-mono font-semibold">{m.maCode}</td>
                    <td>{m.loaiGiam === "PHAN_TRAM" ? `${Number(m.giaTriGiam)}%` : tienVND(m.giaTriGiam)}</td>
                    <td className="text-right">{Number(m.giaTriDonToiThieu) ? tienVND(m.giaTriDonToiThieu) : "–"}</td>
                    <td className="whitespace-nowrap">{ngay(m.ngayBatDau)} → {ngay(m.ngayKetThuc)}</td>
                    <td className="text-right">{m.daSuDung}/{m.soLuongToiDa}</td>
                    <td><NhanTinhTrang t={t} /></td>
                    {laAdmin && <td className="text-right"><Link href={`/khuyen-mai/ma/${m.maMGG}`} className="text-blue-600 hover:underline">Chi tiết</Link></td>}
                  </tr>
                );
              })}
              {mas.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-gray-500">Không có mã phù hợp</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section id="combo" className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-lg font-semibold">Combo sách <span className="text-sm font-normal text-gray-500">({combos.length})</span></h2>
          {laAdmin && <Link href="/khuyen-mai/combo/them" className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">+ Thêm combo</Link>}
        </div>
        {chuoi("daLuuCombo") && <p role="status" className="rounded bg-green-50 px-3 py-2 text-sm text-green-800">✔ Đã lưu combo.</p>}
        <p className="text-xs text-gray-500">POS tự áp combo khi giỏ có đủ bộ: giảm = (giá lẻ 1 bộ − giá combo) × số bộ.</p>
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full min-w-[820px] text-sm [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:whitespace-nowrap">
            <thead className="border-b bg-gray-50 text-left text-gray-600">
              <tr><th className="py-2">Combo</th><th className="text-right">Giá lẻ / bộ</th><th className="text-right">Giá combo</th><th>Thời gian</th><th>Tình trạng</th>{laAdmin && <th />}</tr>
            </thead>
            <tbody>
              {combos.map((c) => {
                const t = tinhTrang(c);
                const giaLe = c.chiTiets.reduce((s, x) => s + Number(x.sach.giaBan) * x.soLuong, 0);
                return (
                  <tr key={c.maCombo} className={`border-b align-top last:border-0 ${t === "DANG_AP_DUNG" ? "" : "text-gray-500"}`}>
                    <td>
                      <div className="font-medium">{c.tenCombo}</div>
                      <div className="text-xs text-gray-500">{c.chiTiets.map((x) => `${x.soLuong > 1 ? `${x.soLuong}× ` : ""}${x.sach.tenSach}`).join(" + ")}</div>
                    </td>
                    <td className="text-right">{tienVND(giaLe)}</td>
                    <td className="text-right font-medium">{tienVND(c.giaCombo)}{giaLe <= Number(c.giaCombo) && <div className="text-xs text-orange-600">không rẻ hơn giá lẻ – POS bỏ qua</div>}</td>
                    <td className="whitespace-nowrap">{ngay(c.ngayBatDau)} → {ngay(c.ngayKetThuc)}</td>
                    <td><NhanTinhTrang t={t} /></td>
                    {laAdmin && <td className="text-right"><Link href={`/khuyen-mai/combo/${c.maCombo}`} className="text-blue-600 hover:underline">Sửa</Link></td>}
                  </tr>
                );
              })}
              {combos.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-gray-500">Chưa có combo</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
