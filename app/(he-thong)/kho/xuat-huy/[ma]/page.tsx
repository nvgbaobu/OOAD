import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { khoService } from "@/lib/services/khoService";
import { tienVND } from "@/lib/dinhDang";
import { ThongTinPhieu, XuLyPhieu } from "../../thanhPhan";

export const metadata: Metadata = { title: "Phiếu xuất hủy" };

export default async function TrangPhieuXuatHuy({ params }: PageProps<"/kho/xuat-huy/[ma]">) {
  const nd = await yeuCauDangNhap("ADMIN", "STAFF");
  const ma = Number.parseInt((await params).ma, 10);
  const p = Number.isInteger(ma) ? await khoService.layXuatHuy(ma) : null;
  if (!p) notFound();
  const choDuyet = p.trangThai === "CHO_DUYET";
  const tongCuon = p.chiTiets.reduce((t, c) => t + c.soLuong, 0);
  const giaTri = p.chiTiets.reduce((t, c) => t + c.soLuong * Number(c.sach.giaNhap), 0);

  return (
    <div className="mx-auto max-w-5xl space-y-3">
      <div className="flex items-center gap-2">
        <h1 className="mr-auto text-lg font-semibold">Phiếu xuất hủy #{p.maPXH}</h1>
        <Link href="/kho/xuat-huy" className="text-sm text-blue-600 hover:underline">← Danh sách phiếu</Link>
      </div>
      <ThongTinPhieu p={p} />
      {choDuyet && nd.vaiTro === "ADMIN" && (
        <XuLyPhieu loai="xuat-huy" ma={p.maPXH} moTaDuyet={`Trừ ${tongCuon} cuốn khỏi tồn kho.`} />
      )}
      {choDuyet && nd.vaiTro !== "ADMIN" && <p className="text-sm text-gray-600">Phiếu đang chờ Admin duyệt.</p>}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[680px] text-sm [&_td]:px-3 [&_td]:py-1.5 [&_th]:px-3">
          <thead className="border-b bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="py-2">Sách</th><th className="text-right">SL hủy</th><th>Lý do</th>
              {nd.vaiTro === "ADMIN" && <th className="text-right">Giá trị (giá nhập)</th>}
              {choDuyet && <th className="text-right">Có thể bán hiện tại</th>}
            </tr>
          </thead>
          <tbody>
            {p.chiTiets.map((c) => {
              const conBan = c.sach.soLuongTon - c.sach.soLuongTamGiu;
              return (
                <tr key={c.maSach} className="border-b last:border-0">
                  <td>{c.sach.tenSach}<div className="text-xs text-gray-500">ISBN {c.sach.isbn}{c.sach.viTriKe && ` · kệ ${c.sach.viTriKe}`}</div></td>
                  <td className="text-right">{c.soLuong}</td>
                  <td>{c.lyDo}</td>
                  {nd.vaiTro === "ADMIN" && <td className="text-right">{tienVND(c.soLuong * Number(c.sach.giaNhap))}</td>}
                  {choDuyet && <td className={`text-right ${conBan < c.soLuong ? "font-semibold text-red-600" : ""}`}>{conBan}{conBan < c.soLuong && " – không đủ"}</td>}
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t bg-gray-50 font-medium">
            <tr>
              <td className="py-2">Tổng</td><td className="text-right">{tongCuon}</td><td />
              {nd.vaiTro === "ADMIN" && <td className="text-right">{tienVND(giaTri)}</td>}
              {choDuyet && <td />}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
