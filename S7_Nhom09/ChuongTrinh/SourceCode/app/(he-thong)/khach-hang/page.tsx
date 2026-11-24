import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { khachHangService } from "@/lib/services/khachHangService";
import type { LocKhachHang } from "@/lib/repositories/khachHangRepository";
import { ngayGio, tienVND } from "@/lib/dinhDang";
import NhanHang from "./NhanHang";

export const metadata: Metadata = { title: "Khách hàng" };

const oLoc = "rounded border px-2 py-1.5 text-sm";

export default async function TrangKhachHang({ searchParams }: PageProps<"/khach-hang">) {
  const nd = await yeuCauDangNhap("ADMIN", "STAFF");
  const sp = await searchParams;
  const chuoi = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : "");
  const loc: LocKhachHang = { tuKhoa: chuoi("q") || undefined, maHang: Number(chuoi("maHang")) || undefined, sapXep: chuoi("sapXep") === "diem" ? "diem" : "moi" };
  const [kq, hangs] = await Promise.all([khachHangService.danhSach(loc, Number(chuoi("trang")) || 1), khachHangService.danhSachHang()]);

  const linkTrang = (t: number) => {
    const p = new URLSearchParams(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][]);
    p.set("trang", String(t));
    return `/khach-hang?${p}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-lg font-semibold">Khách hàng thành viên <span className="text-sm font-normal text-gray-500">({kq.tong})</span></h1>
        {nd.vaiTro === "ADMIN" && <Link href="/khach-hang/hang" className="rounded border bg-white px-3 py-1.5 text-sm hover:bg-gray-50">Hạng thành viên</Link>}
        <Link href="/khach-hang/them" className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">+ Thêm khách hàng</Link>
      </div>

      <Form action="/khach-hang" replace className="flex flex-wrap gap-2 rounded-lg border bg-white p-3">
        <input name="q" defaultValue={chuoi("q")} placeholder="SĐT, họ tên, email..." className={`${oLoc} min-w-60 flex-1`} />
        <select name="maHang" defaultValue={loc.maHang ?? ""} aria-label="Hạng" className={oLoc}>
          <option value="">Mọi hạng</option>
          {hangs.map((h) => <option key={h.maHang} value={h.maHang}>{h.tenHang} ({h._count.khachHangs})</option>)}
        </select>
        <select name="sapXep" defaultValue={loc.sapXep} aria-label="Sắp xếp" className={oLoc}>
          <option value="moi">Mới đăng ký trước</option>
          <option value="diem">Điểm tích lũy cao trước</option>
        </select>
        <button className="rounded bg-gray-800 px-3 py-1.5 text-sm text-white hover:bg-gray-700">Lọc</button>
        <Link href="/khach-hang" className="px-2 py-1.5 text-sm text-gray-600 hover:underline">Xóa lọc</Link>
      </Form>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[820px] text-sm [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:whitespace-nowrap">
          <thead className="border-b bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="py-2">Khách hàng</th><th>Hạng</th><th className="text-right">Điểm hiện có</th><th className="text-right">Điểm tích lũy</th>
              <th className="text-right">Số HĐ</th><th className="text-right">Tổng chi tiêu</th><th>Ngày đăng ký</th>
            </tr>
          </thead>
          <tbody>
            {kq.khachs.map((k) => (
              <tr key={k.maKH} className="border-b last:border-0 hover:bg-gray-50">
                <td>
                  <Link href={`/khach-hang/${k.maKH}`} className="font-medium text-blue-600 hover:underline">{k.hoTen}</Link>
                  <div className="text-xs text-gray-500">{k.soDienThoai}{k.email && ` · ${k.email}`}</div>
                </td>
                <td><NhanHang tenHang={k.hangThanhVien.tenHang} /></td>
                <td className="text-right font-medium">{k.diemHienTai.toLocaleString("vi-VN")}</td>
                <td className="text-right">{k.diemTichLuy.toLocaleString("vi-VN")}</td>
                <td className="text-right">{k.soHoaDon}</td>
                <td className="text-right">{tienVND(k.tongChiTieu)}</td>
                <td className="whitespace-nowrap">{ngayGio(k.ngayTao)}</td>
              </tr>
            ))}
            {kq.khachs.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-500">Không có khách hàng phù hợp</td></tr>}
          </tbody>
        </table>
      </div>

      {kq.soTrang > 1 && (
        <nav className="flex flex-wrap items-center justify-center gap-1 text-sm">
          {Array.from({ length: kq.soTrang }, (_, i) => i + 1).map((t) => (
            <Link key={t} href={linkTrang(t)} aria-current={t === kq.trang ? "page" : undefined}
              className={`rounded border px-2.5 py-1 ${t === kq.trang ? "bg-blue-600 text-white" : "bg-white hover:bg-gray-50"}`}>{t}</Link>
          ))}
        </nav>
      )}
    </div>
  );
}
