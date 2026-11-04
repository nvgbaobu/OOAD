import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { baoCaoService, docKhoangNgay, khoangNgay } from "@/lib/services/baoCaoService";
import { TEN_PHUONG_THUC, type PhuongThucTT } from "@/lib/services/posService";
import { ngay, ngayInput, tienVND } from "@/lib/dinhDang";
import BieuDoCot from "@/app/components/BieuDoCot";

export const metadata: Metadata = { title: "Báo cáo doanh thu" };

const oLoc = "rounded border px-2 py-1.5 text-sm";
const rutGon = (n: number) => (n >= 1e6 ? `${(n / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}tr` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n));
const pt = (a: number, b: number) => (b ? `${Math.round((a / b) * 1000) / 10}%` : "–");

export default async function TrangBaoCao({ searchParams }: PageProps<"/bao-cao">) {
  await yeuCauDangNhap("ADMIN");
  const sp = await searchParams;
  const k = docKhoangNgay(typeof sp.tuNgay === "string" ? sp.tuNgay : undefined, typeof sp.denNgay === "string" ? sp.denNgay : undefined);
  const bc = await baoCaoService.baoCao(k);
  const t = bc.tong;
  const nhanh = (["homNay", "7Ngay", "30Ngay", "thangNay", "thangTruoc"] as const).map((loai) => {
    const x = khoangNgay(loai);
    const den = new Date(x.den); den.setDate(den.getDate() - 1);
    return { loai, href: `/bao-cao?tuNgay=${ngayInput(x.tu)}&denNgay=${ngayInput(den)}`,
      ten: { homNay: "Hôm nay", "7Ngay": "7 ngày", "30Ngay": "30 ngày", thangNay: "Tháng này", thangTruoc: "Tháng trước" }[loai],
      chon: ngayInput(x.tu) === k.tuNgay && ngayInput(den) === k.denNgay };
  });
  const bang = (tieuDe: string, cot: string[], dong: React.ReactNode[][], chiaCot = "") => (
    <section className={`rounded-lg border bg-white ${chiaCot}`}>
      <h2 className="border-b px-3 py-2 text-sm font-semibold">{tieuDe}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm [&_td]:px-3 [&_td]:py-1.5 [&_th]:px-3 [&_th]:whitespace-nowrap">
          <thead className="text-left text-gray-600"><tr>{cot.map((c, i) => <th key={c} className={`py-2 ${i ? "text-right" : ""}`}>{c}</th>)}</tr></thead>
          <tbody>
            {dong.map((d, i) => <tr key={i} className="border-t">{d.map((o, j) => <td key={j} className={j ? "text-right" : ""}>{o}</td>)}</tr>)}
            {dong.length === 0 && <tr><td colSpan={cot.length} className="py-4 text-center text-gray-500">Không có dữ liệu</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-lg font-semibold">Báo cáo doanh thu <span className="text-sm font-normal text-gray-500">{ngay(k.tu)} – {ngay(new Date(k.den.getTime() - 1))}</span></h1>
        <a href={`/bao-cao/excel?tuNgay=${k.tuNgay}&denNgay=${k.denNgay}`} download
          className="rounded bg-green-700 px-3 py-1.5 text-sm text-white hover:bg-green-800">⬇ Xuất Excel</a>
      </div>

      <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-white p-3">
        <Form action="/bao-cao" replace className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-gray-600">Từ ngày<input type="date" name="tuNgay" defaultValue={k.tuNgay} className={`${oLoc} block`} /></label>
          <label className="text-xs text-gray-600">Đến ngày<input type="date" name="denNgay" defaultValue={k.denNgay} className={`${oLoc} block`} /></label>
          <button className="rounded bg-gray-800 px-3 py-1.5 text-sm text-white hover:bg-gray-700">Xem</button>
        </Form>
        <nav className="flex flex-wrap gap-1 text-sm">
          {nhanh.map((n) => (
            <Link key={n.loai} href={n.href} aria-current={n.chon ? "page" : undefined}
              className={`rounded border px-2.5 py-1 ${n.chon ? "bg-blue-600 text-white" : "bg-white hover:bg-gray-50"}`}>{n.ten}</Link>
          ))}
        </nav>
      </div>
      {k.canhBao && <p className="rounded bg-yellow-50 px-3 py-2 text-sm text-yellow-800">{k.canhBao}</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Doanh thu", tienVND(t.doanhThu), `${t.soHoaDon} hóa đơn đã thanh toán`],
          ["Doanh thu trước thuế", tienVND(t.doanhThuTruocThue), `VAT ${tienVND(t.thueVAT)}`],
          ["Giá trị TB / hóa đơn", tienVND(t.giaTriTB), `${t.soCuon} cuốn · ${t.soKhachThanhVien} khách thành viên`],
          ["Hóa đơn đã hủy", String(t.soHoaDonHuy), `${tienVND(t.giaTriHuy)} – không tính vào doanh thu`],
        ].map(([nhan, so, phu]) => (
          <div key={nhan} className="rounded-lg border bg-white p-3">
            <div className="text-xs text-gray-500">{nhan}</div><div className="text-xl font-semibold">{so}</div><div className="text-xs text-gray-600">{phu}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-lg border bg-white p-4 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold">Doanh thu theo ngày</h2>
          {bc.theoNgay.length <= 62
            ? <BieuDoCot cot={bc.theoNgay.map((x) => ({ nhan: `${x.ngay.slice(8)}/${x.ngay.slice(5, 7)}`, giaTri: x.doanhThu, chuThich: `${x.soHoaDon} hóa đơn · ${x.soCuon} cuốn` }))} dinhDang={tienVND} nhanTruc={rutGon} />
            : <p className="text-sm text-gray-500">Khoảng ngày dài hơn 62 ngày – xem bảng bên dưới hoặc xuất Excel.</p>}
        </section>
        {bang("Cơ cấu doanh thu", ["Khoản", "Số tiền"], [
          ["Tạm tính (giá lẻ)", tienVND(t.tamTinh)],
          ["− Giảm combo", tienVND(t.giamCombo)],
          ["− Ưu đãi hạng thẻ", tienVND(t.giamHangThe)],
          ["− Mã giảm giá", tienVND(t.giamMaGiamGia)],
          ["− Đổi điểm", tienVND(t.giamDiem)],
          ["+ Thuế GTGT", tienVND(t.thueVAT)],
          [<b key="a">= Doanh thu</b>, <b key="b">{tienVND(t.doanhThu)}</b>],
        ])}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {bang("Theo thể loại (tiền hàng trước giảm giá)", ["Thể loại", "Số cuốn", "Tiền hàng", "Tỷ trọng"],
          bc.theoTheLoai.map((x) => [x.tenTL, x.soCuon, tienVND(x.tienHang), pt(x.tienHang, t.tamTinh)]))}
        {bang("Top 10 sách bán chạy", ["Sách", "Số cuốn", "Tiền hàng"],
          bc.topSach.map((x) => [<span key="s">{x.tenSach}<span className="block text-xs text-gray-500">{x.tenTL}</span></span>, x.soCuon, tienVND(x.tienHang)]))}
        {bang("Theo nhân viên", ["Nhân viên", "Số HĐ", "Doanh thu", "Tỷ trọng"],
          bc.theoNhanVien.map((x) => [x.hoTen, x.soHoaDon, tienVND(x.doanhThu), pt(x.doanhThu, t.doanhThu)]))}
        {bang("Theo phương thức thanh toán", ["Phương thức", "Số HĐ", "Doanh thu", "Tỷ trọng"],
          bc.theoPhuongThuc.map((x) => [TEN_PHUONG_THUC[x.pt as PhuongThucTT] ?? x.pt, x.soHoaDon, tienVND(x.doanhThu), pt(x.doanhThu, t.doanhThu)]))}
      </div>

      {bang("Chi tiết theo ngày", ["Ngày", "Số HĐ", "Số cuốn", "Doanh thu"],
        bc.theoNgay.filter((x) => x.soHoaDon).map((x) => [ngay(new Date(`${x.ngay}T00:00:00`)), x.soHoaDon, x.soCuon, tienVND(x.doanhThu)]))}
    </div>
  );
}
