import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { khuyenMaiService, tinhTrang } from "@/lib/services/khuyenMaiService";
import { doiTrangThaiMaGiamGia, xoaMaGiamGia } from "@/app/actions/khuyenMai";
import FormHanhDong from "@/app/components/FormHanhDong";
import { ngayInput, tienVND } from "@/lib/dinhDang";
import FormMaGiamGia from "../../FormMaGiamGia";
import NhanTinhTrang from "../../NhanTinhTrang";

export const metadata: Metadata = { title: "Mã giảm giá" };

export default async function TrangSuaMa({ params }: PageProps<"/khuyen-mai/ma/[maMGG]">) {
  await yeuCauDangNhap("ADMIN");
  const id = Number.parseInt((await params).maMGG, 10);
  const ct = Number.isInteger(id) ? await khuyenMaiService.layMa(id) : null;
  if (!ct) notFound();
  const { ma, thongKe, daDung } = ct;
  const hoatDong = ma.trangThai === "HOAT_DONG";
  const banDau = {
    maCode: ma.maCode, loaiGiam: ma.loaiGiam, giaTriGiam: String(Number(ma.giaTriGiam)), giaTriDonToiThieu: String(Number(ma.giaTriDonToiThieu)),
    soLuongToiDa: String(ma.soLuongToiDa), ngayBatDau: ngayInput(ma.ngayBatDau), ngayKetThuc: ngayInput(ma.ngayKetThuc),
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="mr-auto text-lg font-semibold">Mã <span className="font-mono">{ma.maCode}</span> <NhanTinhTrang t={tinhTrang(ma)} /></h1>
        <Link href="/khuyen-mai" className="text-sm text-blue-600 hover:underline">← Khuyến mãi</Link>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-white p-3 text-sm">
        <span>Đã dùng <b>{ma.daSuDung}/{ma.soLuongToiDa}</b> lượt · {thongKe.soHoaDon} hóa đơn đã thanh toán, tổng giảm <b>{tienVND(thongKe.tongGiam)}</b>, doanh thu {tienVND(thongKe.doanhThu)}</span>
        <FormHanhDong action={doiTrangThaiMaGiamGia} className="ml-auto" xacNhan={hoatDong ? `Ngừng mã ${ma.maCode}? Đơn đang lập có mã này sẽ không thanh toán được với mã.` : undefined}>
          <input type="hidden" name="maMGG" value={ma.maMGG} />
          <input type="hidden" name="hoatDong" value={hoatDong ? "0" : "1"} />
          <button className={`rounded border px-3 py-1 ${hoatDong ? "border-orange-300 text-orange-700 hover:bg-orange-50" : "border-green-300 text-green-700 hover:bg-green-50"}`}>
            {hoatDong ? "Ngừng hoạt động" : "Hoạt động lại"}
          </button>
        </FormHanhDong>
        {!daDung && (
          <FormHanhDong action={xoaMaGiamGia} xacNhan={`Xóa hẳn mã ${ma.maCode}?`}>
            <input type="hidden" name="maMGG" value={ma.maMGG} />
            <button className="rounded border border-red-300 px-3 py-1 text-red-700 hover:bg-red-50">Xóa</button>
          </FormHanhDong>
        )}
      </div>
      <div className="rounded-lg border bg-white p-4">
        <FormMaGiamGia banDau={banDau} maMGG={ma.maMGG} khoaMaCode={daDung} />
      </div>
      <p className="text-xs text-gray-500">Đổi mức giảm chỉ áp dụng cho đơn chưa thanh toán; hóa đơn cũ giữ số tiền đã giảm.</p>
    </div>
  );
}
