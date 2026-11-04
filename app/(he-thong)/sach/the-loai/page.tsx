import type { Metadata } from "next";
import Link from "next/link";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { sachService, THUE_SUAT_HOP_LE } from "@/lib/services/sachService";
import { luuTheLoai, xoaTheLoai } from "@/app/actions/sach";
import FormHanhDong from "@/app/components/FormHanhDong";

export const metadata: Metadata = { title: "Thể loại" };

const oNhap = "rounded border px-2 py-1 text-sm";

function ChonThue({ macDinh }: { macDinh: number }) {
  return (
    <select name="thueSuatVAT" defaultValue={macDinh} className={oNhap}>
      {THUE_SUAT_HOP_LE.map((t) => <option key={t} value={t}>VAT {t}%</option>)}
    </select>
  );
}

export default async function TrangTheLoai() {
  await yeuCauDangNhap("ADMIN");
  const theLoais = await sachService.danhSachTheLoaiKemSoSach();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="mr-auto text-lg font-semibold">Thể loại &amp; thuế suất VAT</h1>
        <Link href="/sach" className="text-sm text-blue-600 hover:underline">← Danh sách sách</Link>
      </div>
      <p className="rounded bg-blue-50 p-3 text-sm text-blue-900">
        <b>0%</b> (không chịu thuế GTGT): sách chính trị, giáo dục, văn hóa – sách giáo khoa, giáo trình, pháp luật, khoa học...
        <br /><b>5%</b>: sách còn lại – tham khảo, ngoại ngữ, truyện, kỹ năng sống...
        <br />Đổi thuế suất chỉ áp dụng cho đơn mới (hóa đơn cũ giữ thuế suất lúc bán).
      </p>

      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold">Thêm thể loại</h2>
        <FormHanhDong action={luuTheLoai} className="flex flex-wrap gap-2">
          <input name="tenTL" placeholder="Tên thể loại" className={`${oNhap} flex-1`} />
          <ChonThue macDinh={5} />
          <button className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700">Thêm</button>
        </FormHanhDong>
      </div>

      <div className="divide-y rounded-lg border bg-white">
        {theLoais.map((t) => (
          <div key={t.maTL} className="flex flex-wrap items-start gap-2 p-3">
            <FormHanhDong action={luuTheLoai} className="flex flex-1 flex-wrap gap-2">
              <input type="hidden" name="maTL" value={t.maTL} />
              <input name="tenTL" defaultValue={t.tenTL} className={`${oNhap} min-w-48 flex-1`} />
              <ChonThue macDinh={Number(t.thueSuatVAT)} />
              <button className="rounded border px-2 py-1 text-sm hover:bg-gray-50">Lưu</button>
            </FormHanhDong>
            <span className="w-20 pt-1 text-right text-sm text-gray-500">{t._count.sachs} sách</span>
            <FormHanhDong action={xoaTheLoai} xacNhan={`Xóa thể loại "${t.tenTL}"?`} className="flex flex-col items-end">
              <input type="hidden" name="maTL" value={t.maTL} />
              <button disabled={t._count.sachs > 0} title={t._count.sachs > 0 ? "Chỉ xóa được thể loại chưa có sách" : undefined}
                className="px-2 py-1 text-sm text-red-600 hover:underline disabled:text-gray-300 disabled:no-underline">
                Xóa
              </button>
            </FormHanhDong>
          </div>
        ))}
      </div>
    </div>
  );
}
