import type { Metadata } from "next";
import Link from "next/link";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { khachHangService } from "@/lib/services/khachHangService";
import { cauHinhRepository } from "@/lib/repositories/cauHinhRepository";
import { xoaHang } from "@/app/actions/khachHang";
import FormHanhDong from "@/app/components/FormHanhDong";
import { tienVND } from "@/lib/dinhDang";
import FormHang from "./FormHang";

export const metadata: Metadata = { title: "Hạng thành viên" };

export default async function TrangHangThanhVien({ searchParams }: PageProps<"/khach-hang/hang">) {
  await yeuCauDangNhap("ADMIN");
  const [hangs, ch, sp] = await Promise.all([khachHangService.danhSachHang(), cauHinhRepository.lay(), searchParams]);
  const soDoi = typeof sp.soDoi === "string" ? Number(sp.soDoi) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="mr-auto text-lg font-semibold">Hạng thành viên &amp; tích điểm</h1>
        <Link href="/khach-hang" className="text-sm text-blue-600 hover:underline">← Khách hàng</Link>
      </div>
      <p className="rounded bg-blue-50 p-3 text-sm text-blue-900">
        Tích điểm: mỗi <b>{tienVND(ch.tyLeQuyDoiDiem)}</b> trong tổng tiền hóa đơn = 1 điểm; đổi điểm: 1 điểm = <b>{tienVND(ch.giaTriMotDiem)}</b> (sửa ở Cài đặt).
        <br />Hạng của khách = hạng có mốc điểm cao nhất mà <b>điểm tích lũy</b> đạt được. Lưu thay đổi sẽ xét lại hạng toàn bộ khách hàng.
      </p>
      {soDoi !== null && !Number.isNaN(soDoi) && (
        <p role="status" className="rounded bg-green-50 px-3 py-2 text-sm text-green-800">✔ Đã lưu. {soDoi} khách hàng được xếp lại hạng.</p>
      )}

      <div className="divide-y rounded-lg border bg-white">
        {hangs.map((h) => (
          <div key={h.maHang} className="flex flex-wrap items-start gap-2 p-3">
            <FormHang maHang={h.maHang} banDau={{ tenHang: h.tenHang, diemToiThieu: String(h.diemToiThieu), phanTramUuDai: String(Number(h.phanTramUuDai)) }} />
            <span className="w-24 pt-1 text-right text-sm text-gray-500">{h._count.khachHangs} khách</span>
            {h.diemToiThieu === 0
              ? <span className="w-12 pt-1 text-xs text-gray-400" title="Hạng của khách mới – không xóa">mặc định</span>
              : (
                <FormHanhDong action={xoaHang} xacNhan={`Xóa hạng "${h.tenHang}"? ${h._count.khachHangs} khách sẽ được xếp sang hạng thấp hơn.`} className="w-12">
                  <input type="hidden" name="maHang" value={h.maHang} />
                  <button className="pt-1 text-sm text-red-600 hover:underline">Xóa</button>
                </FormHanhDong>
              )}
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-white p-3">
        <h2 className="mb-2 text-sm font-semibold">Thêm hạng</h2>
        <FormHang banDau={{ tenHang: "", diemToiThieu: "", phanTramUuDai: "" }} />
      </div>
    </div>
  );
}
