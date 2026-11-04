import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { TEN_PHUONG_THUC, type PhuongThucTT } from "@/lib/services/posService";
import { hoaDonService } from "@/lib/services/hoaDonService";
import { huyHoaDon } from "@/app/actions/hoaDon";
import FormHanhDong from "@/app/components/FormHanhDong";
import { cauHinhRepository } from "@/lib/repositories/cauHinhRepository";
import { tienVND, ngayGio } from "@/lib/dinhDang";
import NutIn from "./NutIn";

export const metadata: Metadata = { title: "Hóa đơn" };

export default async function TrangHoaDon({ params }: PageProps<"/hoa-don/[maHD]">) {
  const nd = await yeuCauDangNhap("ADMIN", "STAFF");
  const maHD = Number.parseInt((await params).maHD, 10);
  const [hd, ch] = await Promise.all([Number.isInteger(maHD) ? hoaDonService.xem(maHD, nd) : null, cauHinhRepository.lay()]);
  if (!hd) notFound();

  const tienThua = hd.tienKhachDua ? Number(hd.tienKhachDua) - Number(hd.tongTien) : 0;
  const daHuy = hd.trangThai === "DA_HUY";
  const coTheHuy = nd.vaiTro === "ADMIN" && hd.trangThai === "DA_THANH_TOAN";

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-3 flex gap-2 print:hidden">
        <NutIn />
        <Link href="/pos" className="rounded border bg-white px-3 py-1.5 hover:bg-gray-50">Đơn mới</Link>
        <Link href="/hoa-don" className="ml-auto self-center text-sm text-blue-600 hover:underline">← Danh sách hóa đơn</Link>
      </div>

      {daHuy && (
        <p className="mb-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800 print:hidden">
          {hd.phuongThucTT ? "Hóa đơn đã thanh toán và bị hủy" : "Đơn nháp đã hủy (chưa thanh toán)"} lúc {ngayGio(hd.thoiGianCapNhat)}.
          {hd.phuongThucTT && ` Đã hoàn kho${hd.khachHang ? ", thu hồi điểm đã cộng" : ""}${hd.diemSuDung ? ", hoàn điểm đã dùng" : ""}${hd.maGiamGia ? ", hoàn lượt mã giảm giá" : ""}.`} Lý do: {hd.lyDoHuy}
        </p>
      )}

      <article className="rounded-lg border bg-white p-5 text-sm print:border-0">
        <header className="mb-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- logo là URL tùy ý do Admin nhập, không qua next/image */}
          {ch.logo && <img src={ch.logo} alt="" className="mx-auto mb-1 max-h-16" />}
          <h1 className="text-lg font-bold">{ch.tenCuaHang}</h1>
          {ch.diaChi && <p>{ch.diaChi}</p>}
          <p>{ch.soDienThoai && `ĐT: ${ch.soDienThoai}`}{ch.maSoThue && ` · MST: ${ch.maSoThue}`}</p>
          <h2 className="mt-3 font-semibold">HÓA ĐƠN BÁN HÀNG</h2>
          <p>Số: #{hd.maHD} · {ngayGio(hd.thoiGianTao)}</p>
          {hd.trangThai === "DA_HUY" && <p className="mt-1 font-bold text-red-600">ĐÃ HỦY{hd.lyDoHuy && ` – ${hd.lyDoHuy}`}</p>}
        </header>

        <p>Thu ngân: {hd.taiKhoan.hoTen}</p>
        <p className="mb-2">
          Khách hàng: {hd.khachHang ? `${hd.khachHang.hoTen} (${hd.khachHang.soDienThoai}) – hạng ${hd.khachHang.hangThanhVien.tenHang}` : "Khách lẻ"}
        </p>

        <table className="mb-2 w-full border-y">
          <thead>
            <tr className="text-left">
              <th className="py-1">Sách</th><th className="text-right">SL</th><th className="text-right">Đơn giá</th><th className="text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {hd.chiTiets.map((c) => (
              <tr key={c.maSach} className="border-t align-top">
                <td className="py-1">{c.sach.tenSach}<span className="text-xs text-gray-500"> (VAT {Number(c.thueSuatVAT)}%)</span></td>
                <td className="text-right">{c.soLuong}</td>
                <td className="text-right">{tienVND(c.donGiaBan)}</td>
                <td className="text-right">{tienVND(c.thanhTien)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="space-y-0.5">
          <Dong nhan="Tạm tính" giaTri={tienVND(hd.tamTinh)} />
          {Number(hd.giamCombo) > 0 && <Dong nhan="Giảm combo" giaTri={`−${tienVND(hd.giamCombo)}`} />}
          {Number(hd.giamHangThe) > 0 && <Dong nhan="Ưu đãi hạng thẻ" giaTri={`−${tienVND(hd.giamHangThe)}`} />}
          {Number(hd.giamMaGiamGia) > 0 && <Dong nhan={`Mã giảm giá ${hd.maGiamGia?.maCode ?? ""}`} giaTri={`−${tienVND(hd.giamMaGiamGia)}`} />}
          {Number(hd.giamDiem) > 0 && <Dong nhan={`Đổi ${hd.diemSuDung} điểm`} giaTri={`−${tienVND(hd.giamDiem)}`} />}
          <Dong nhan="Thuế GTGT" giaTri={tienVND(hd.thueVAT)} />
          <div className="flex justify-between border-t pt-1 text-base font-bold">
            <dt>TỔNG CỘNG</dt><dd>{tienVND(hd.tongTien)}</dd>
          </div>
          <Dong nhan="Thanh toán" giaTri={TEN_PHUONG_THUC[hd.phuongThucTT as PhuongThucTT] ?? "—"} />
          {hd.phuongThucTT === "TIEN_MAT" && (
            <>
              <Dong nhan="Tiền khách đưa" giaTri={tienVND(hd.tienKhachDua ?? 0)} />
              <Dong nhan="Tiền thừa" giaTri={tienVND(tienThua)} />
            </>
          )}
          {hd.khachHang && <Dong nhan="Điểm được cộng" giaTri={`${hd.diemCong} điểm${daHuy && hd.phuongThucTT ? " (đã thu hồi)" : ""}`} />}
        </dl>

        <p className="mt-4 text-center italic">Cảm ơn quý khách và hẹn gặp lại!</p>
      </article>

      {coTheHuy && (
        <details className="mt-4 rounded-lg border border-red-200 bg-white p-3 text-sm print:hidden">
          <summary className="cursor-pointer font-medium text-red-700">Hủy hóa đơn</summary>
          <p className="my-2 text-gray-600">
            Sách được hoàn về kho
            {hd.khachHang && `, khách bị trừ ${hd.diemCong} điểm đã cộng`}
            {hd.diemSuDung > 0 && ` và được hoàn ${hd.diemSuDung} điểm đã dùng`}
            {hd.maGiamGia && `, hoàn 1 lượt mã ${hd.maGiamGia.maCode}`}. Không hoàn tác được.
          </p>
          <FormHanhDong action={huyHoaDon} xacNhan={`Hủy hóa đơn #${hd.maHD} (${tienVND(hd.tongTien)})?`} className="flex flex-wrap gap-2">
            <input type="hidden" name="maHD" value={hd.maHD} />
            <input name="lyDoHuy" required maxLength={255} placeholder="Lý do hủy (bắt buộc), VD: khách trả hàng" className="flex-1 rounded border px-2 py-1" />
            <button className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700">Hủy hóa đơn</button>
          </FormHanhDong>
        </details>
      )}
    </div>
  );
}

function Dong({ nhan, giaTri }: { nhan: string; giaTri: string }) {
  return (
    <div className="flex justify-between">
      <dt className="whitespace-pre text-gray-600">{nhan}</dt><dd>{giaTri}</dd>
    </div>
  );
}
