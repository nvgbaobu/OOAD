import type { Metadata } from "next";
import Link from "next/link";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { khoService } from "@/lib/services/khoService";
import { tienVND } from "@/lib/dinhDang";

export const metadata: Metadata = { title: "Tồn kho" };

export default async function TrangKho() {
  const nd = await yeuCauDangNhap("ADMIN", "STAFF");
  const { thongKe, sapHet, choDuyet } = await khoService.tongQuan();
  const the = (nhan: string, giaTri: string) => (
    <div className="rounded-lg border bg-white p-3">
      <div className="text-xs text-gray-500">{nhan}</div>
      <div className="text-lg font-semibold">{giaTri}</div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-lg font-semibold">Tồn kho</h1>
        <Link href="/kho/phieu-nhap/tao" className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">+ Lập phiếu nhập</Link>
        <Link href="/kho/kiem-ke/tao" className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">+ Lập phiếu kiểm kê</Link>
        <Link href="/kho/xuat-huy/tao" className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">+ Lập phiếu xuất hủy</Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {the("Đầu sách đang bán", String(thongKe.soDauSach))}
        {the("Tổng số cuốn tồn", thongKe.tongCuon.toLocaleString("vi-VN"))}
        {nd.vaiTro === "ADMIN" && the("Giá trị tồn (giá nhập)", tienVND(thongKe.giaTriTon))}
        <Link href="/kho/phieu-nhap?trangThai=CHO_DUYET" className="rounded-lg border bg-white p-3 hover:border-blue-400">
          <div className="text-xs text-gray-500">Phiếu nhập chờ duyệt</div>
          <div className={`text-lg font-semibold ${choDuyet.phieuNhap ? "text-yellow-700" : ""}`}>{choDuyet.phieuNhap}</div>
        </Link>
        <Link href="/kho/kiem-ke?trangThai=CHO_DUYET" className="rounded-lg border bg-white p-3 hover:border-blue-400">
          <div className="text-xs text-gray-500">Phiếu kiểm kê chờ duyệt</div>
          <div className={`text-lg font-semibold ${choDuyet.kiemKe ? "text-yellow-700" : ""}`}>{choDuyet.kiemKe}</div>
        </Link>
        <Link href="/kho/xuat-huy?trangThai=CHO_DUYET" className="rounded-lg border bg-white p-3 hover:border-blue-400">
          <div className="text-xs text-gray-500">Phiếu xuất hủy chờ duyệt</div>
          <div className={`text-lg font-semibold ${choDuyet.xuatHuy ? "text-yellow-700" : ""}`}>{choDuyet.xuatHuy}</div>
        </Link>
      </div>

      <section className="rounded-lg border bg-white">
        <h2 className="flex items-center border-b px-3 py-2 text-sm font-semibold">
          <span className="mr-auto">⚠ Sách sắp hết hàng (tồn ≤ định mức) – {sapHet.length} đầu sách</span>
          {sapHet.length > 0 && (
            <Link href="/kho/phieu-nhap/tao?sapHet=1" className="mr-3 rounded bg-blue-600 px-2 py-1 font-normal text-white hover:bg-blue-700">Lập phiếu nhập cho các sách này</Link>
          )}
          <Link href="/sach?sapHet=1" className="font-normal text-blue-600 hover:underline">Xem ở danh sách sách →</Link>
        </h2>
        <table className="w-full text-sm [&_td]:px-3 [&_td]:py-1.5 [&_th]:px-3">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr><th className="py-2">Sách</th><th>Thể loại</th><th>Kệ</th><th className="text-right">Tồn</th><th className="text-right">Tạm giữ</th><th className="text-right">Định mức</th></tr>
          </thead>
          <tbody>
            {sapHet.map((s) => (
              <tr key={s.maSach} className="border-t">
                <td>{s.tenSach}<div className="text-xs text-gray-500">ISBN {s.isbn}</div></td>
                <td>{s.theLoai.tenTL}</td>
                <td>{s.viTriKe ?? "–"}</td>
                <td className={`text-right font-semibold ${s.soLuongTon === 0 ? "text-red-600" : "text-orange-600"}`}>{s.soLuongTon}</td>
                <td className="text-right">{s.soLuongTamGiu || "–"}</td>
                <td className="text-right">{s.dinhMucToiThieu}</td>
              </tr>
            ))}
            {sapHet.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-gray-500">Không có sách nào dưới định mức</td></tr>}
          </tbody>
        </table>
      </section>
      <p className="text-xs text-gray-500">Tồn kho chỉ thay đổi khi bán hàng hoặc khi Admin duyệt phiếu nhập / kiểm kê / xuất hủy.</p>
    </div>
  );
}
