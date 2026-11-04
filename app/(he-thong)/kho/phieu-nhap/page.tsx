import type { Metadata } from "next";
import Link from "next/link";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { khoService } from "@/lib/services/khoService";
import { ngayGio, tienVND } from "@/lib/dinhDang";
import { LocTrangThai, NhanTrangThai, docTrangThai } from "../thanhPhan";

export const metadata: Metadata = { title: "Phiếu nhập" };

export default async function TrangDanhSachPhieuNhap({ searchParams }: PageProps<"/kho/phieu-nhap">) {
  const nd = await yeuCauDangNhap("ADMIN", "STAFF");
  const trangThai = docTrangThai((await searchParams).trangThai);
  const ds = await khoService.danhSachPhieuNhap(trangThai);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-lg font-semibold">Phiếu nhập</h1>
        <Link href="/kho" className="text-sm text-blue-600 hover:underline">← Tồn kho</Link>
        {nd.vaiTro === "ADMIN" && <Link href="/nha-cung-cap" className="rounded border bg-white px-3 py-1.5 text-sm hover:bg-gray-50">Nhà cung cấp</Link>}
        <Link href="/kho/phieu-nhap/tao" className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">+ Lập phiếu nhập</Link>
      </div>
      <LocTrangThai loai="phieu-nhap" hienTai={trangThai} />
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[820px] text-sm [&_td]:px-3 [&_td]:py-2 [&_th]:px-3">
          <thead className="border-b bg-gray-50 text-left text-gray-600">
            <tr><th className="py-2">Số phiếu</th><th>Ngày lập</th><th>Nhà cung cấp</th><th>Người lập</th><th className="text-right">Số sách</th><th className="text-right">Tổng tiền</th><th>Trạng thái</th></tr>
          </thead>
          <tbody>
            {ds.map((p) => (
              <tr key={p.maPN} className="border-b last:border-0 hover:bg-gray-50">
                <td><Link href={`/kho/phieu-nhap/${p.maPN}`} className="font-medium text-blue-600 hover:underline">#{p.maPN}</Link></td>
                <td>{ngayGio(p.ngayLap)}</td>
                <td>{p.nhaCungCap.tenNCC}</td>
                <td>{p.nguoiLap.hoTen}</td>
                <td className="text-right">{p._count.chiTiets}</td>
                <td className="text-right">{tienVND(p.tongTien)}</td>
                <td><NhanTrangThai trangThai={p.trangThai} /></td>
              </tr>
            ))}
            {ds.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-gray-500">Không có phiếu</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
