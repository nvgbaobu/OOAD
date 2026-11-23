import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { sachService } from "@/lib/services/sachService";
import { doiTrangThaiSach } from "@/app/actions/sach";
import FormHanhDong from "@/app/components/FormHanhDong";
import FormSach from "../FormSach";

export const metadata: Metadata = { title: "Sửa sách" };

export default async function TrangSuaSach({ params }: PageProps<"/sach/[maSach]">) {
  await yeuCauDangNhap("ADMIN");
  const maSach = Number.parseInt((await params).maSach, 10);
  const [sach, theLoais] = await Promise.all([
    Number.isInteger(maSach) ? sachService.layChiTiet(maSach) : null,
    sachService.danhSachTheLoai(),
  ]);
  if (!sach) notFound();
  const dangBan = sach.trangThai === "DANG_BAN";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="rounded-lg border bg-white p-5">
        <h1 className="mb-1 text-lg font-semibold">Sửa sách #{sach.maSach}</h1>
        <p className="mb-4 text-sm text-gray-500">Đổi giá chỉ áp dụng cho đơn mới; hóa đơn cũ giữ giá lúc bán.</p>
        <FormSach
          maSach={sach.maSach}
          theLoais={theLoais.map((t) => ({ maTL: t.maTL, tenTL: t.tenTL }))}
          banDau={{
            isbn: sach.isbn, tenSach: sach.tenSach, tacGia: sach.tacGia, nhaXuatBan: sach.nhaXuatBan ?? "",
            namXB: sach.namXB?.toString() ?? "", maTL: String(sach.maTL), giaNhap: String(Number(sach.giaNhap)),
            giaBan: String(Number(sach.giaBan)), viTriKe: sach.viTriKe ?? "", dinhMucToiThieu: String(sach.dinhMucToiThieu),
            hinhAnh: sach.hinhAnh ?? "",
          }}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-white p-5 text-sm">
          <h2 className="mb-2 font-semibold">Tồn kho <span className="font-normal text-gray-500">(chỉ đổi qua phiếu nhập / kiểm kê / xuất hủy)</span></h2>
          <dl className="grid grid-cols-2 gap-y-1">
            <dt className="text-gray-600">Tồn kho</dt><dd className="text-right">{sach.soLuongTon}</dd>
            <dt className="text-gray-600">Đang tạm giữ</dt><dd className="text-right">{sach.soLuongTamGiu}</dd>
            <dt className="text-gray-600">Còn bán được</dt><dd className="text-right font-semibold">{sach.soLuongTon - sach.soLuongTamGiu}</dd>
          </dl>
        </div>

        <div className="rounded-lg border bg-white p-5 text-sm">
          <h2 className="mb-2 font-semibold">Trạng thái: {dangBan ? "Đang bán" : "Ngừng kinh doanh"}</h2>
          <p className="mb-3 text-gray-600">
            {dangBan
              ? "Ngừng kinh doanh: sách ẩn khỏi POS, vẫn giữ dữ liệu cho hóa đơn cũ."
              : "Mở bán lại: sách hiện lại trên POS."}
          </p>
          <FormHanhDong
            action={doiTrangThaiSach}
            xacNhan={dangBan ? `Ngừng kinh doanh "${sach.tenSach}"?` : undefined}
            className="flex flex-wrap gap-2"
          >
            <input type="hidden" name="maSach" value={sach.maSach} />
            <input type="hidden" name="trangThai" value={dangBan ? "NGUNG_KINH_DOANH" : "DANG_BAN"} />
            <button className={`rounded px-3 py-1.5 text-white ${dangBan ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}>
              {dangBan ? "Ngừng kinh doanh" : "Mở bán lại"}
            </button>
          </FormHanhDong>
        </div>
      </div>
    </div>
  );
}
