import type { Metadata } from "next";
import Link from "next/link";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { khoService } from "@/lib/services/khoService";
import { ngayGio } from "@/lib/dinhDang";
import { LocTrangThai, NhanTrangThai, docTrangThai } from "../thanhPhan";

export const metadata: Metadata = { title: "Phiếu kiểm kê" };

export default async function TrangDanhSachKiemKe({ searchParams }: PageProps<"/kho/kiem-ke">) {
  await yeuCauDangNhap("ADMIN", "STAFF");
  const trangThai = docTrangThai((await searchParams).trangThai);
  const ds = await khoService.danhSachKiemKe(trangThai);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-lg font-semibold">Phiếu kiểm kê</h1>
        <Link href="/kho" className="text-sm text-blue-600 hover:underline">← Tồn kho</Link>
        <Link href="/kho/kiem-ke/tao" className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">+ Lập phiếu kiểm kê</Link>
      </div>
      <LocTrangThai loai="kiem-ke" hienTai={trangThai} />
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[760px] text-sm [&_td]:px-3 [&_td]:py-2 [&_th]:px-3">
          <thead className="border-b bg-gray-50 text-left text-gray-600">
            <tr><th className="py-2">Số phiếu</th><th>Ngày lập</th><th>Người lập</th><th className="text-right">Số sách</th><th className="text-right">Sách lệch</th><th>Ghi chú</th><th>Trạng thái</th></tr>
          </thead>
          <tbody>
            {ds.map((p) => (
              <tr key={p.maPKK} className="border-b last:border-0 hover:bg-gray-50">
                <td><Link href={`/kho/kiem-ke/${p.maPKK}`} className="font-medium text-blue-600 hover:underline">#{p.maPKK}</Link></td>
                <td>{ngayGio(p.ngayLap)}</td>
                <td>{p.nguoiLap.hoTen}</td>
                <td className="text-right">{p.chiTiets.length}</td>
                <td className="text-right">{p.chiTiets.filter((c) => c.slThucTe !== c.slHeThong).length}</td>
                <td className="max-w-64 truncate">{p.ghiChu}</td>
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
