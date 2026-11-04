import type { Metadata } from "next";
import Link from "next/link";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { baoCaoService } from "@/lib/services/baoCaoService";
import { gioPhut, ngayGio, tienVND } from "@/lib/dinhDang";
import BieuDoCot from "@/app/components/BieuDoCot";

export const metadata: Metadata = { title: "Dashboard" };

const rutGon = (n: number) => (n >= 1e6 ? `${(n / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}tr` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n));

/** So sánh với hôm qua: ▲/▼ % (chữ màu xám-đen, mũi tên mang ý nghĩa – không dùng màu một mình). */
function SoSanh({ nay, truoc }: { nay: number; truoc: number }) {
  if (!truoc) return <span className="text-xs text-gray-500">{nay ? "hôm qua chưa có" : "–"}</span>;
  const pt = Math.round(((nay - truoc) / truoc) * 100);
  return <span className="text-xs text-gray-600">{pt >= 0 ? "▲" : "▼"} {Math.abs(pt)}% so với hôm qua</span>;
}

export default async function TrangDashboard() {
  const nd = await yeuCauDangNhap("ADMIN");
  const d = await baoCaoService.dashboard();
  const viec = [
    { n: d.canXuLy.phieuNhap, nhan: "phiếu nhập chờ duyệt", href: "/kho/phieu-nhap?trangThai=CHO_DUYET" },
    { n: d.canXuLy.kiemKe, nhan: "phiếu kiểm kê chờ duyệt", href: "/kho/kiem-ke?trangThai=CHO_DUYET" },
    { n: d.canXuLy.xuatHuy, nhan: "phiếu xuất hủy chờ duyệt", href: "/kho/xuat-huy?trangThai=CHO_DUYET" },
    { n: d.canXuLy.sapHet, nhan: "đầu sách sắp hết hàng", href: "/kho" },
    { n: d.canXuLy.donDangLap, nhan: "đơn đang lập ở quầy", href: "/pos" },
  ];
  const tongBayNgay = d.bayNgay.reduce((t, x) => t + x.doanhThu, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-lg font-semibold">Dashboard <span className="text-sm font-normal text-gray-500">– xin chào {nd.hoTen}, cập nhật lúc {gioPhut(new Date())}</span></h1>
        <Link href="/bao-cao" className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">Báo cáo doanh thu &amp; xuất Excel</Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-3">
          <div className="text-xs text-gray-500">Doanh thu hôm nay</div>
          <div className="text-2xl font-semibold">{tienVND(d.homNay.doanhThu)}</div>
          <SoSanh nay={d.homNay.doanhThu} truoc={d.homQua.doanhThu} />
        </div>
        <div className="rounded-lg border bg-white p-3">
          <div className="text-xs text-gray-500">Hóa đơn hôm nay</div>
          <div className="text-2xl font-semibold">{d.homNay.soHoaDon}</div>
          <SoSanh nay={d.homNay.soHoaDon} truoc={d.homQua.soHoaDon} />
        </div>
        <div className="rounded-lg border bg-white p-3">
          <div className="text-xs text-gray-500">Sách bán hôm nay</div>
          <div className="text-2xl font-semibold">{d.homNay.soCuon} <span className="text-sm font-normal">cuốn</span></div>
          <span className="text-xs text-gray-600">TB {tienVND(d.homNay.giaTriTB)} / hóa đơn</span>
        </div>
        <div className="rounded-lg border bg-white p-3">
          <div className="text-xs text-gray-500">Doanh thu tháng này</div>
          <div className="text-2xl font-semibold">{tienVND(d.thangNay.doanhThu)}</div>
          <span className="text-xs text-gray-600">{d.thangNay.soHoaDon} hóa đơn · {d.thangNay.soHoaDonHuy} đã hủy</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-lg border bg-white p-4 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold">Doanh thu 7 ngày gần nhất <span className="font-normal text-gray-500">– tổng {tienVND(tongBayNgay)}</span></h2>
          <BieuDoCot
            cot={d.bayNgay.map((x) => ({ nhan: `${x.ngay.slice(8)}/${x.ngay.slice(5, 7)}`, giaTri: x.doanhThu, chuThich: `${x.soHoaDon} hóa đơn · ${x.soCuon} cuốn` }))}
            dinhDang={tienVND} nhanTruc={rutGon}
          />
        </section>

        <section className="rounded-lg border bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold">Cần xử lý</h2>
          <ul className="space-y-1 text-sm">
            {viec.map((v) => (
              <li key={v.nhan}>
                <Link href={v.href} className={`flex items-center justify-between rounded px-2 py-1.5 hover:bg-gray-50 ${v.n ? "" : "text-gray-400"}`}>
                  <span>{v.n ? "⚠ " : "✓ "}{v.nhan}</span><b>{v.n}</b>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border bg-white">
          <h2 className="border-b px-3 py-2 text-sm font-semibold">Sách bán chạy 30 ngày</h2>
          <table className="w-full text-sm [&_td]:px-3 [&_td]:py-1.5 [&_th]:px-3">
            <thead className="text-left text-gray-600"><tr><th className="py-2">#</th><th>Sách</th><th className="text-right">Số cuốn</th><th className="text-right">Tiền hàng</th></tr></thead>
            <tbody>
              {d.topSach.map((s, i) => (
                <tr key={s.tenSach} className="border-t">
                  <td>{i + 1}</td><td>{s.tenSach}<div className="text-xs text-gray-500">{s.tenTL}</div></td>
                  <td className="text-right font-medium">{s.soCuon}</td><td className="text-right">{tienVND(s.tienHang)}</td>
                </tr>
              ))}
              {d.topSach.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-gray-500">Chưa có dữ liệu</td></tr>}
            </tbody>
          </table>
        </section>

        <section className="rounded-lg border bg-white">
          <h2 className="flex border-b px-3 py-2 text-sm font-semibold"><span className="mr-auto">Hóa đơn gần đây</span><Link href="/hoa-don" className="font-normal text-blue-600 hover:underline">Xem tất cả →</Link></h2>
          <table className="w-full text-sm [&_td]:px-3 [&_td]:py-1.5">
            <tbody>
              {d.hoaDonGanDay.map((h) => (
                <tr key={h.maHD} className={`border-t first:border-0 ${h.trangThai === "DA_HUY" ? "text-gray-400" : ""}`}>
                  <td><Link href={`/hoa-don/${h.maHD}`} className="text-blue-600 hover:underline">#{h.maHD}</Link></td>
                  <td className="whitespace-nowrap">{ngayGio(h.thoiGianTao)}</td>
                  <td>{h.khachHang?.hoTen ?? "Khách lẻ"}<div className="text-xs text-gray-500">{h.taiKhoan.hoTen}</div></td>
                  <td className={`text-right ${h.trangThai === "DA_HUY" ? "line-through" : "font-medium"}`}>{tienVND(h.tongTien)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
