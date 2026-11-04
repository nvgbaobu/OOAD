import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { nhaCungCapService, TRANG_THAI_NCC } from "@/lib/services/nhaCungCapService";
import { doiTrangThaiNhaCungCap, xoaNhaCungCap } from "@/app/actions/nhaCungCap";
import FormHanhDong from "@/app/components/FormHanhDong";
import { ngayGio, tienVND } from "@/lib/dinhDang";
import { NhanTrangThai } from "../../kho/thanhPhan";
import FormNhaCungCap from "../FormNhaCungCap";

export const metadata: Metadata = { title: "Nhà cung cấp" };

export default async function TrangSuaNhaCungCap({ params }: PageProps<"/nha-cung-cap/[maNCC]">) {
  await yeuCauDangNhap("ADMIN");
  const ma = Number.parseInt((await params).maNCC, 10);
  const ct = Number.isInteger(ma) ? await nhaCungCapService.layChiTiet(ma) : null;
  if (!ct) notFound();
  const { ncc, thongKe, phieuNhaps } = ct;
  const dangGD = ncc.trangThaiHopTac === "DANG_GIAO_DICH";
  const banDau = Object.fromEntries(
    (["tenNCC", "maSoThue", "diaChi", "nguoiLienHe", "soDienThoai"] as const).map((k) => [k, ncc[k] ?? ""]),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="mr-auto text-lg font-semibold">{ncc.tenNCC}</h1>
        <Link href="/nha-cung-cap" className="text-sm text-blue-600 hover:underline">← Danh sách</Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-white p-3 text-sm">
        <span>Trạng thái: <b>{TRANG_THAI_NCC[ncc.trangThaiHopTac as keyof typeof TRANG_THAI_NCC]}</b></span>
        <span className="text-gray-500">· Đã nhập {thongKe.soPhieu} phiếu, tổng {tienVND(thongKe.tongTien)}</span>
        <FormHanhDong action={doiTrangThaiNhaCungCap} className="ml-auto"
          xacNhan={dangGD ? `Ngừng giao dịch với "${ncc.tenNCC}"? Sẽ không lập được phiếu nhập mới từ NCC này.` : undefined}>
          <input type="hidden" name="maNCC" value={ncc.maNCC} />
          <input type="hidden" name="trangThai" value={dangGD ? "NGUNG_GIAO_DICH" : "DANG_GIAO_DICH"} />
          <button className={`rounded border px-3 py-1 ${dangGD ? "border-orange-300 text-orange-700 hover:bg-orange-50" : "border-green-300 text-green-700 hover:bg-green-50"}`}>
            {dangGD ? "Ngừng giao dịch" : "Giao dịch lại"}
          </button>
        </FormHanhDong>
        {phieuNhaps.length === 0 && (
          <FormHanhDong action={xoaNhaCungCap} xacNhan={`Xóa hẳn "${ncc.tenNCC}"?`}>
            <input type="hidden" name="maNCC" value={ncc.maNCC} />
            <button className="rounded border border-red-300 px-3 py-1 text-red-700 hover:bg-red-50">Xóa</button>
          </FormHanhDong>
        )}
      </div>

      <div className="rounded-lg border bg-white p-4"><FormNhaCungCap banDau={banDau} maNCC={ncc.maNCC} /></div>

      <section className="rounded-lg border bg-white">
        <h2 className="border-b px-3 py-2 text-sm font-semibold">Phiếu nhập gần đây</h2>
        <table className="w-full text-sm [&_td]:px-3 [&_td]:py-1.5 [&_th]:px-3">
          <thead className="bg-gray-50 text-left text-gray-600"><tr><th className="py-2">Số phiếu</th><th>Ngày lập</th><th>Người lập</th><th className="text-right">Tổng tiền</th><th>Trạng thái</th></tr></thead>
          <tbody>
            {phieuNhaps.map((p) => (
              <tr key={p.maPN} className="border-t">
                <td><Link href={`/kho/phieu-nhap/${p.maPN}`} className="text-blue-600 hover:underline">#{p.maPN}</Link></td>
                <td>{ngayGio(p.ngayLap)}</td><td>{p.nguoiLap.hoTen}</td>
                <td className="text-right">{tienVND(p.tongTien)}</td><td><NhanTrangThai trangThai={p.trangThai} /></td>
              </tr>
            ))}
            {phieuNhaps.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-gray-500">Chưa có phiếu nhập</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}
