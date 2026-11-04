import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { khoService } from "@/lib/services/khoService";
import { ThongTinPhieu, XuLyPhieu } from "../../thanhPhan";

export const metadata: Metadata = { title: "Phiếu kiểm kê" };

export default async function TrangPhieuKiemKe({ params }: PageProps<"/kho/kiem-ke/[ma]">) {
  const nd = await yeuCauDangNhap("ADMIN", "STAFF");
  const ma = Number.parseInt((await params).ma, 10);
  const p = Number.isInteger(ma) ? await khoService.layKiemKe(ma) : null;
  if (!p) notFound();
  const choDuyet = p.trangThai === "CHO_DUYET";
  const soLech = p.chiTiets.filter((c) => c.slThucTe !== c.slHeThong).length;

  return (
    <div className="mx-auto max-w-5xl space-y-3">
      <div className="flex items-center gap-2">
        <h1 className="mr-auto text-lg font-semibold">Phiếu kiểm kê #{p.maPKK}</h1>
        <Link href="/kho/kiem-ke" className="text-sm text-blue-600 hover:underline">← Danh sách phiếu</Link>
      </div>
      <ThongTinPhieu p={p} />
      {choDuyet && nd.vaiTro === "ADMIN" && (
        <XuLyPhieu loai="kiem-ke" ma={p.maPKK}
          moTaDuyet={soLech ? `Tồn kho của ${soLech} sách sẽ được cộng/trừ phần chênh lệch.` : "Không có chênh lệch, tồn kho giữ nguyên."} />
      )}
      {choDuyet && nd.vaiTro !== "ADMIN" && <p className="text-sm text-gray-600">Phiếu đang chờ Admin duyệt.</p>}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[760px] text-sm [&_td]:px-3 [&_td]:py-1.5 [&_th]:px-3">
          <thead className="border-b bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="py-2">Sách</th><th className="text-right">SL hệ thống</th><th className="text-right">SL thực tế</th>
              <th className="text-right">Chênh lệch</th><th>Lý do</th>
              {choDuyet && <th className="text-right" title="Tồn kho hiện tại → sau khi duyệt">Tồn hiện tại → sau duyệt</th>}
            </tr>
          </thead>
          <tbody>
            {p.chiTiets.map((c) => {
              const chenh = c.slThucTe - c.slHeThong;
              return (
                <tr key={c.maSach} className="border-b last:border-0">
                  <td>{c.sach.tenSach}<div className="text-xs text-gray-500">ISBN {c.sach.isbn}{c.sach.viTriKe && ` · kệ ${c.sach.viTriKe}`}</div></td>
                  <td className="text-right">{c.slHeThong}</td>
                  <td className="text-right">{c.slThucTe}</td>
                  <td className={`text-right font-medium ${chenh > 0 ? "text-green-700" : chenh < 0 ? "text-red-600" : "text-gray-400"}`}>{chenh > 0 ? `+${chenh}` : chenh}</td>
                  <td>{c.lyDoChenhLech}</td>
                  {choDuyet && (
                    <td className="text-right whitespace-nowrap">
                      {c.sach.soLuongTon} → <b>{c.sach.soLuongTon + chenh}</b>
                      {c.sach.soLuongTon !== c.slHeThong && <div className="text-xs text-orange-600">tồn đã đổi từ lúc lập phiếu</div>}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
