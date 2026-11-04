import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { hoaDonService, TRANG_THAI_HOA_DON } from "@/lib/services/hoaDonService";
import { TEN_PHUONG_THUC } from "@/lib/services/posService";
import type { LocHoaDon } from "@/lib/repositories/hoaDonRepository";
import { ngayGio, tienVND } from "@/lib/dinhDang";

export const metadata: Metadata = { title: "Hóa đơn" };

const oLoc = "rounded border px-2 py-1.5 text-sm";

/** "YYYY-MM-DD" → 0 giờ ngày đó (giờ máy chủ = giờ cửa hàng); sau = true → 0 giờ ngày hôm sau. */
function docNgay(s: string, sau = false) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return undefined;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + (sau ? 1 : 0));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export default async function TrangHoaDon({ searchParams }: PageProps<"/hoa-don">) {
  const nd = await yeuCauDangNhap("ADMIN", "STAFF");
  const laAdmin = nd.vaiTro === "ADMIN";
  const sp = await searchParams;
  const chuoi = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : "");
  const loc: LocHoaDon = {
    tuKhoa: chuoi("q") || undefined,
    tuNgay: docNgay(chuoi("tuNgay")),
    denNgay: docNgay(chuoi("denNgay"), true),
    trangThai: chuoi("trangThai") in TRANG_THAI_HOA_DON ? (chuoi("trangThai") as LocHoaDon["trangThai"]) : undefined,
    maTK: Number(chuoi("maTK")) || undefined,
    phuongThucTT: chuoi("pt") in TEN_PHUONG_THUC ? chuoi("pt") : undefined,
  };
  const [kq, nhanViens] = await Promise.all([
    hoaDonService.danhSach(loc, Number(chuoi("trang")) || 1, nd),
    laAdmin ? hoaDonService.nhanVien() : [],
  ]);

  const linkTrang = (t: number) => {
    const p = new URLSearchParams(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][]);
    p.set("trang", String(t));
    return `/hoa-don?${p}`;
  };

  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">
        Hóa đơn {!laAdmin && <span className="text-sm font-normal text-gray-500">(do bạn lập)</span>}
      </h1>

      <Form action="/hoa-don" replace className="flex flex-wrap items-end gap-2 rounded-lg border bg-white p-3">
        <input name="q" defaultValue={chuoi("q")} placeholder="Số HĐ, SĐT hoặc tên khách" className={`${oLoc} min-w-52 flex-1`} />
        <label className="text-xs text-gray-600">Từ ngày<input type="date" name="tuNgay" defaultValue={chuoi("tuNgay")} className={`${oLoc} block`} /></label>
        <label className="text-xs text-gray-600">Đến ngày<input type="date" name="denNgay" defaultValue={chuoi("denNgay")} className={`${oLoc} block`} /></label>
        <select name="trangThai" defaultValue={loc.trangThai ?? ""} aria-label="Trạng thái" className={oLoc}>
          <option value="">Mọi trạng thái</option>
          {Object.entries(TRANG_THAI_HOA_DON).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select name="pt" defaultValue={loc.phuongThucTT ?? ""} aria-label="Phương thức" className={oLoc}>
          <option value="">Mọi phương thức</option>
          {Object.entries(TEN_PHUONG_THUC).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {laAdmin && (
          <select name="maTK" defaultValue={loc.maTK ?? ""} aria-label="Nhân viên" className={oLoc}>
            <option value="">Mọi nhân viên</option>
            {nhanViens.map((n) => <option key={n.maTK} value={n.maTK}>{n.hoTen}</option>)}
          </select>
        )}
        <button className="rounded bg-gray-800 px-3 py-1.5 text-sm text-white hover:bg-gray-700">Lọc</button>
        <Link href="/hoa-don" className="px-2 py-1.5 text-sm text-gray-600 hover:underline">Xóa lọc</Link>
      </Form>

      <p className="text-sm text-gray-700">
        {kq.soHoaDon} hóa đơn · <b>{kq.soDaThanhToan}</b> đã thanh toán, doanh thu <b>{tienVND(kq.doanhThu)}</b>
        <span className="text-gray-500"> (không tính hóa đơn đã hủy)</span>
      </p>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[820px] text-sm [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:whitespace-nowrap">
          <thead className="border-b bg-gray-50 text-left text-gray-600">
            <tr><th className="py-2">Số HĐ</th><th>Thời gian</th><th>Khách hàng</th><th>Thu ngân</th><th className="text-right">Số sách</th><th>Thanh toán</th><th className="text-right">Tổng tiền</th><th>Trạng thái</th></tr>
          </thead>
          <tbody>
            {kq.hoaDons.map((h) => {
              const huy = h.trangThai === "DA_HUY";
              return (
                <tr key={h.maHD} className={`border-b last:border-0 hover:bg-gray-50 ${huy ? "text-gray-400" : ""}`}>
                  <td><Link href={`/hoa-don/${h.maHD}`} className="font-medium text-blue-600 hover:underline">#{h.maHD}</Link></td>
                  <td className="whitespace-nowrap">{ngayGio(h.thoiGianTao)}</td>
                  <td>{h.khachHang ? <>{h.khachHang.hoTen}<div className="text-xs text-gray-500">{h.khachHang.soDienThoai}</div></> : "Khách lẻ"}</td>
                  <td>{h.taiKhoan.hoTen}</td>
                  <td className="text-right">{h._count.chiTiets}</td>
                  <td>{h.phuongThucTT ? TEN_PHUONG_THUC[h.phuongThucTT as keyof typeof TEN_PHUONG_THUC] : "–"}</td>
                  <td className={`text-right ${huy ? "line-through" : "font-medium"}`}>{h.phuongThucTT ? tienVND(h.tongTien) : "–"}</td>
                  <td>
                    {huy
                      ? <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs whitespace-nowrap text-red-700" title={h.lyDoHuy ?? undefined}>{h.phuongThucTT ? "Đã hủy" : "Nháp đã hủy"}</span>
                      : <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs whitespace-nowrap text-green-800">Đã thanh toán</span>}
                  </td>
                </tr>
              );
            })}
            {kq.hoaDons.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-gray-500">Không có hóa đơn phù hợp</td></tr>}
          </tbody>
        </table>
      </div>

      {kq.soTrang > 1 && (
        <nav className="flex flex-wrap items-center justify-center gap-1 text-sm">
          {Array.from({ length: kq.soTrang }, (_, i) => i + 1).map((t) => (
            <Link key={t} href={linkTrang(t)} aria-current={t === kq.trang ? "page" : undefined}
              className={`rounded border px-2.5 py-1 ${t === kq.trang ? "bg-blue-600 text-white" : "bg-white hover:bg-gray-50"}`}>
              {t}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
