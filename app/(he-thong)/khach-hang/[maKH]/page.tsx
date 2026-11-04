import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { khachHangService } from "@/lib/services/khachHangService";
import { xoaKhachHang } from "@/app/actions/khachHang";
import FormHanhDong from "@/app/components/FormHanhDong";
import { ngayGio, tienVND } from "@/lib/dinhDang";
import FormKhachHang from "../FormKhachHang";
import NhanHang from "../NhanHang";

export const metadata: Metadata = { title: "Khách hàng" };

export default async function TrangChiTietKhachHang({ params, searchParams }: PageProps<"/khach-hang/[maKH]">) {
  const nd = await yeuCauDangNhap("ADMIN", "STAFF");
  const ma = Number.parseInt((await params).maKH, 10);
  const ct = Number.isInteger(ma) ? await khachHangService.layChiTiet(ma) : null;
  if (!ct) notFound();
  const { kh, soHoaDon, tongChiTieu, hoaDons, hangKeTiep } = ct;
  const daLuu = (await searchParams).daLuu === "1";
  const banDau = { soDienThoai: kh.soDienThoai, hoTen: kh.hoTen, email: kh.email ?? "", diaChi: kh.diaChi ?? "" };
  const the = (nhan: string, giaTri: React.ReactNode) => (
    <div className="rounded-lg border bg-white p-3"><div className="text-xs text-gray-500">{nhan}</div><div className="text-lg font-semibold">{giaTri}</div></div>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-lg font-semibold">{kh.hoTen} <NhanHang tenHang={kh.hangThanhVien.tenHang} /></h1>
        <Link href="/khach-hang" className="text-sm text-blue-600 hover:underline">← Danh sách</Link>
      </div>
      {daLuu && <p role="status" className="rounded bg-green-50 px-3 py-2 text-sm text-green-800">✔ Đã lưu thông tin khách hàng.</p>}

      <div className="grid gap-3 sm:grid-cols-4">
        {the("Điểm hiện có", `${kh.diemHienTai.toLocaleString("vi-VN")} điểm`)}
        {the("Điểm tích lũy", kh.diemTichLuy.toLocaleString("vi-VN"))}
        {the("Hóa đơn đã mua", soHoaDon)}
        {the("Tổng chi tiêu", tienVND(tongChiTieu))}
      </div>
      <p className="rounded bg-blue-50 px-3 py-2 text-sm text-blue-900">
        Hạng <b>{kh.hangThanhVien.tenHang}</b> – ưu đãi {Number(kh.hangThanhVien.phanTramUuDai)}% mỗi hóa đơn.{" "}
        {hangKeTiep
          ? <>Còn <b>{(hangKeTiep.diemToiThieu - kh.diemTichLuy).toLocaleString("vi-VN")}</b> điểm tích lũy để lên hạng <b>{hangKeTiep.tenHang}</b> (ưu đãi {Number(hangKeTiep.phanTramUuDai)}%).</>
          : "Đang ở hạng cao nhất."}
      </p>

      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">Thông tin khách hàng <span className="font-normal text-gray-500">– đăng ký {ngayGio(kh.ngayTao)}</span></h2>
        <FormKhachHang banDau={banDau} maKH={kh.maKH} />
        {nd.vaiTro === "ADMIN" && hoaDons.length === 0 && (
          <FormHanhDong action={xoaKhachHang} xacNhan={`Xóa khách hàng "${kh.hoTen}"?`} className="mt-3 border-t pt-3">
            <input type="hidden" name="maKH" value={kh.maKH} />
            <button className="text-sm text-red-600 hover:underline">Xóa khách hàng (chưa có hóa đơn)</button>
          </FormHanhDong>
        )}
      </div>

      <section className="rounded-lg border bg-white">
        <h2 className="border-b px-3 py-2 text-sm font-semibold">Lịch sử tích / đổi điểm (theo hóa đơn)</h2>
        <table className="w-full text-sm [&_td]:px-3 [&_td]:py-1.5 [&_th]:px-3">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr><th className="py-2">Hóa đơn</th><th>Thời gian</th><th className="text-right">Tổng tiền</th><th className="text-right">Điểm cộng</th><th className="text-right">Điểm đã dùng</th><th>Ghi chú</th></tr>
          </thead>
          <tbody>
            {hoaDons.map((h) => {
              const huy = h.trangThai === "DA_HUY";
              const xemDuoc = nd.vaiTro === "ADMIN" || h.maTK === nd.maTK;
              return (
                <tr key={h.maHD} className={`border-t ${huy ? "text-gray-400" : ""}`}>
                  <td>{xemDuoc ? <Link href={`/hoa-don/${h.maHD}`} className="text-blue-600 hover:underline">#{h.maHD}</Link> : `#${h.maHD}`}</td>
                  <td className="whitespace-nowrap">{ngayGio(h.thoiGianTao)}</td>
                  <td className={`text-right ${huy ? "line-through" : ""}`}>{tienVND(h.tongTien)}</td>
                  <td className={`text-right ${huy ? "line-through" : h.diemCong ? "text-green-700" : ""}`}>{h.diemCong ? `+${h.diemCong}` : "–"}</td>
                  <td className={`text-right ${huy ? "line-through" : h.diemSuDung ? "text-red-600" : ""}`}>{h.diemSuDung ? `−${h.diemSuDung}` : "–"}</td>
                  <td className="text-xs">{huy && `Hóa đơn đã hủy lúc ${ngayGio(h.thoiGianCapNhat)} – điểm đã được hoàn/thu hồi`}</td>
                </tr>
              );
            })}
            {hoaDons.length === 0 && <tr><td colSpan={6} className="py-4 text-center text-gray-500">Chưa có hóa đơn</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}
