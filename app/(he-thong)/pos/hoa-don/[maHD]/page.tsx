import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { posService, TEN_PHUONG_THUC, type PhuongThucTT } from "@/lib/services/posService";
import { cauHinhRepository } from "@/lib/repositories/cauHinhRepository";
import { tienVND, ngayGio } from "@/lib/dinhDang";
import NutIn from "./NutIn";

export const metadata: Metadata = { title: "Hóa đơn" };

export default async function TrangHoaDon({ params }: PageProps<"/pos/hoa-don/[maHD]">) {
  const nd = await yeuCauDangNhap("ADMIN", "STAFF");
  const maHD = Number.parseInt((await params).maHD, 10);
  const [hd, ch] = await Promise.all([Number.isInteger(maHD) ? posService.xemHoaDon(maHD, nd) : null, cauHinhRepository.lay()]);
  if (!hd) notFound();

  const tienThua = hd.tienKhachDua ? Number(hd.tienKhachDua) - Number(hd.tongTien) : 0;

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-3 flex gap-2 print:hidden">
        <NutIn />
        <Link href="/pos" className="rounded border bg-white px-3 py-1.5 hover:bg-gray-50">Đơn mới</Link>
      </div>

      <article className="rounded-lg border bg-white p-5 text-sm print:border-0">
        <header className="mb-3 text-center">
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
          {hd.khachHang && <Dong nhan="Điểm được cộng" giaTri={`${hd.diemCong} điểm`} />}
        </dl>

        <p className="mt-4 text-center italic">Cảm ơn quý khách và hẹn gặp lại!</p>
      </article>
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
