import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { sachRepository } from "@/lib/repositories/sachRepository";
import FormDinhMuc from "./FormDinhMuc";

export const metadata: Metadata = { title: "Thiết lập định mức" };

/** UC4.2 – Thiết lập định mức tồn kho tối thiểu (chỉ Admin). Hiển thị tối đa 200 sách đang bán theo bộ lọc. */
export default async function TrangDinhMuc(props: PageProps<"/kho/dinh-muc">) {
  await yeuCauDangNhap("ADMIN");
  const sp = await props.searchParams;
  const tuKhoa = typeof sp.tuKhoa === "string" ? sp.tuKhoa.trim() : "";
  const sapHet = sp.sapHet === "1";
  const ds = await sachRepository.danhSach({ tuKhoa, trangThai: "DANG_BAN", sapHet }, 0, 200);
  const sachs = ds.map((s) => ({ maSach: s.maSach, tenSach: s.tenSach, isbn: s.isbn, tenTL: s.theLoai.tenTL, soLuongTon: s.soLuongTon, dinhMucToiThieu: s.dinhMucToiThieu }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="mr-auto text-lg font-semibold">Thiết lập định mức tồn kho</h1>
        <Link href="/kho" className="text-sm text-blue-600 hover:underline">← Tồn kho</Link>
      </div>
      <Form action="/kho/dinh-muc" className="flex flex-wrap items-center gap-2 text-sm">
        <input name="tuKhoa" defaultValue={tuKhoa} placeholder="Tên sách, ISBN, tác giả…" className="w-72 rounded border px-2 py-1" />
        <label className="flex items-center gap-1"><input type="checkbox" name="sapHet" value="1" defaultChecked={sapHet} /> Chỉ sách sắp hết</label>
        <button className="rounded border px-3 py-1 hover:bg-gray-50">Lọc</button>
      </Form>
      <p className="text-xs text-gray-500">Tick một hoặc nhiều sách, nhập định mức rồi bấm “Thiết lập”. Sách có tồn ≤ định mức sẽ hiện trong mục “Sách sắp hết hàng” ở Tồn kho và Dashboard.</p>
      <FormDinhMuc key={`${tuKhoa}|${sapHet}`} sachs={sachs} />
    </div>
  );
}
