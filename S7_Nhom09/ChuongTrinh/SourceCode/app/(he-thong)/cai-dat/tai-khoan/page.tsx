import type { Metadata } from "next";
import Link from "next/link";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { taiKhoanService, TEN_VAI_TRO } from "@/lib/services/taiKhoanService";
import type { VaiTro } from "@/lib/auth/token";
import { ngayGio } from "@/lib/dinhDang";
import FormTaiKhoan from "./FormTaiKhoan";

export const metadata: Metadata = { title: "Tài khoản" };

export default async function TrangTaiKhoan({ searchParams }: PageProps<"/cai-dat/tai-khoan">) {
  const nd = await yeuCauDangNhap("ADMIN");
  const [ds, sp] = await Promise.all([taiKhoanService.danhSach(), searchParams]);
  const daLuu = Number(sp.daLuu) || null;

  return (
    <div className="space-y-4">
      {daLuu && <p role="status" className="rounded bg-green-50 px-3 py-2 text-sm text-green-800">✔ Đã lưu tài khoản #{daLuu}.</p>}
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[760px] text-sm [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:whitespace-nowrap">
          <thead className="border-b bg-gray-50 text-left text-gray-600">
            <tr><th className="py-2">Họ tên</th><th>Tên đăng nhập (SĐT)</th><th>Vai trò</th><th className="text-right">HĐ đã bán</th><th>Ngày tạo</th><th>Trạng thái</th><th /></tr>
          </thead>
          <tbody>
            {ds.map((t) => (
              <tr key={t.maTK} className={`border-b last:border-0 ${t.trangThai !== "HOAT_DONG" ? "text-gray-400" : ""} ${t.maTK === daLuu ? "bg-green-50" : ""}`}>
                <td><span className="font-medium">{t.hoTen}</span>{t.maTK === nd.maTK && <span className="text-xs text-gray-500"> (bạn)</span>}<div className="text-xs text-gray-500">{t.email}</div></td>
                <td>{t.soDienThoai}</td>
                <td><span className={`rounded px-1.5 py-0.5 text-xs ${t.vaiTro === "ADMIN" ? "bg-purple-100 text-purple-800" : "bg-gray-100"}`}>{TEN_VAI_TRO[t.vaiTro as VaiTro]}</span></td>
                <td className="text-right">{t._count.hoaDons}</td>
                <td className="whitespace-nowrap">{ngayGio(t.ngayTao)}</td>
                <td>{t.trangThai === "HOAT_DONG"
                  ? <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800">Hoạt động</span>
                  : <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">Đã khóa</span>}</td>
                <td className="text-right"><Link href={`/cai-dat/tai-khoan/${t.maTK}`} className="text-blue-600 hover:underline">Chi tiết</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="max-w-3xl rounded-lg border bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">Thêm tài khoản</h2>
        <FormTaiKhoan banDau={{ vaiTro: "STAFF" }} />
      </section>
    </div>
  );
}
