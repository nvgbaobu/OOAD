import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { khoService } from "@/lib/services/khoService";
import { tienVND } from "@/lib/dinhDang";
import { ThongTinPhieu, XuLyPhieu } from "../../thanhPhan";

export const metadata: Metadata = { title: "Phiếu nhập" };

export default async function TrangPhieuNhap({ params }: PageProps<"/kho/phieu-nhap/[ma]">) {
  const nd = await yeuCauDangNhap("ADMIN", "STAFF");
  const ma = Number.parseInt((await params).ma, 10);
  const p = Number.isInteger(ma) ? await khoService.layPhieuNhap(ma) : null;
  if (!p) notFound();
  const choDuyet = p.trangThai === "CHO_DUYET";
  const tongCuon = p.chiTiets.reduce((t, c) => t + c.soLuong, 0);
  const soDoiGia = p.chiTiets.filter((c) => Number(c.giaNhap) !== Number(c.sach.giaNhap)).length;

  return (
    <div className="mx-auto max-w-5xl space-y-3">
      <div className="flex items-center gap-2">
        <h1 className="mr-auto text-lg font-semibold">Phiếu nhập #{p.maPN}</h1>
        <Link href="/kho/phieu-nhap" className="text-sm text-blue-600 hover:underline">← Danh sách phiếu</Link>
      </div>
      <div className="rounded-lg border bg-white p-4 text-sm">
        <span className="text-gray-500">Nhà cung cấp: </span><b>{p.nhaCungCap.tenNCC}</b>
        <span className="text-gray-500"> · MST {p.nhaCungCap.maSoThue}{p.nhaCungCap.soDienThoai && ` · ĐT ${p.nhaCungCap.soDienThoai}`}</span>
      </div>
      <ThongTinPhieu p={p} />
      {choDuyet && nd.vaiTro === "ADMIN" && (
        <XuLyPhieu loai="phieu-nhap" ma={p.maPN}
          moTaDuyet={`Cộng ${tongCuon} cuốn vào tồn kho${soDoiGia ? `, cập nhật giá nhập ${soDoiGia} sách` : ""}.`} />
      )}
      {choDuyet && nd.vaiTro !== "ADMIN" && <p className="text-sm text-gray-600">Phiếu đang chờ Admin duyệt.</p>}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[760px] text-sm [&_td]:px-3 [&_td]:py-1.5 [&_th]:px-3">
          <thead className="border-b bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="py-2">Sách</th><th className="text-right">SL nhập</th><th className="text-right">Giá nhập</th><th className="text-right">Thành tiền</th>
              {choDuyet && <><th className="text-right">Giá nhập hiện tại</th><th className="text-right">Tồn → sau duyệt</th></>}
            </tr>
          </thead>
          <tbody>
            {p.chiTiets.map((c) => {
              const doiGia = Number(c.giaNhap) !== Number(c.sach.giaNhap);
              return (
                <tr key={c.maSach} className="border-b last:border-0">
                  <td>{c.sach.tenSach}<div className="text-xs text-gray-500">ISBN {c.sach.isbn} · giá bán {tienVND(c.sach.giaBan)}</div></td>
                  <td className="text-right">{c.soLuong}</td>
                  <td className="text-right">{tienVND(c.giaNhap)}</td>
                  <td className="text-right">{tienVND(c.soLuong * Number(c.giaNhap))}</td>
                  {choDuyet && (
                    <>
                      <td className={`text-right ${doiGia ? "text-orange-600" : "text-gray-400"}`}>{tienVND(c.sach.giaNhap)}{doiGia && " (sẽ đổi)"}</td>
                      <td className="text-right whitespace-nowrap">{c.sach.soLuongTon} → <b>{c.sach.soLuongTon + c.soLuong}</b></td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t bg-gray-50 font-semibold">
            <tr><td className="py-2">Tổng cộng</td><td className="text-right">{tongCuon}</td><td /><td className="text-right">{tienVND(p.tongTien)}</td>{choDuyet && <><td /><td /></>}</tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
