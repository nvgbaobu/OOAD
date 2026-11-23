import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { caiDatService, type LocNhatKy } from "@/lib/services/caiDatService";
import { taiKhoanService } from "@/lib/services/taiKhoanService";
import { docNgayInput, ngayGio } from "@/lib/dinhDang";

export const metadata: Metadata = { title: "Nhật ký hệ thống" };

const oLoc = "rounded border px-2 py-1.5 text-sm";

export default async function TrangNhatKy({ searchParams }: PageProps<"/cai-dat/nhat-ky">) {
  await yeuCauDangNhap("ADMIN");
  const sp = await searchParams;
  const chuoi = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : "");
  const den = docNgayInput(chuoi("denNgay"));
  const loc: LocNhatKy = {
    module: chuoi("module") || undefined, maTK: Number(chuoi("maTK")) || undefined, tuKhoa: chuoi("q") || undefined,
    tuNgay: docNgayInput(chuoi("tuNgay")) ?? undefined, denNgay: den ? new Date(den.getFullYear(), den.getMonth(), den.getDate() + 1) : undefined,
  };
  const [kq, modules, taiKhoans] = await Promise.all([caiDatService.nhatKy(loc, Number(chuoi("trang")) || 1), caiDatService.cacModuleNhatKy(), taiKhoanService.danhSach()]);
  const linkTrang = (t: number) => {
    const p = new URLSearchParams(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][]);
    p.set("trang", String(t));
    return `/cai-dat/nhat-ky?${p}`;
  };

  return (
    <div className="space-y-3">
      <Form action="/cai-dat/nhat-ky" replace className="flex flex-wrap items-end gap-2 rounded-lg border bg-white p-3">
        <input name="q" defaultValue={chuoi("q")} placeholder="Tìm trong nội dung / hành động" className={`${oLoc} min-w-52 flex-1`} />
        <select name="module" defaultValue={loc.module ?? ""} aria-label="Module" className={oLoc}>
          <option value="">Mọi module</option>
          {modules.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select name="maTK" defaultValue={loc.maTK ?? ""} aria-label="Người thực hiện" className={oLoc}>
          <option value="">Mọi người dùng</option>
          {taiKhoans.map((t) => <option key={t.maTK} value={t.maTK}>{t.hoTen}</option>)}
        </select>
        <label className="text-xs text-gray-600">Từ ngày<input type="date" name="tuNgay" defaultValue={chuoi("tuNgay")} className={`${oLoc} block`} /></label>
        <label className="text-xs text-gray-600">Đến ngày<input type="date" name="denNgay" defaultValue={chuoi("denNgay")} className={`${oLoc} block`} /></label>
        <button className="rounded bg-gray-800 px-3 py-1.5 text-sm text-white hover:bg-gray-700">Lọc</button>
        <Link href="/cai-dat/nhat-ky" className="px-2 py-1.5 text-sm text-gray-600 hover:underline">Xóa lọc</Link>
      </Form>
      <p className="text-sm text-gray-600">{kq.tong.toLocaleString("vi-VN")} dòng nhật ký</p>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[820px] text-sm [&_td]:px-3 [&_td]:py-1.5 [&_th]:px-3 [&_th]:whitespace-nowrap">
          <thead className="border-b bg-gray-50 text-left text-gray-600">
            <tr><th className="py-2">Thời gian</th><th>Người thực hiện</th><th>Module</th><th>Hành động</th><th>Nội dung</th></tr>
          </thead>
          <tbody>
            {kq.dong.map((n) => (
              <tr key={String(n.maLog)} className="border-b align-top last:border-0">
                <td className="whitespace-nowrap">{ngayGio(n.thoiGian)}</td>
                <td className="whitespace-nowrap">{n.taiKhoan?.hoTen ?? <span className="text-gray-400">(chưa đăng nhập)</span>}</td>
                <td className="font-mono text-xs">{n.module}</td>
                <td className={`font-mono text-xs ${/THAT_BAI|BI_KHOA|HUY|XOA|KHOA/.test(n.hanhDong) ? "text-red-700" : ""}`}>{n.hanhDong}</td>
                <td className="break-words">{n.noiDung}</td>
              </tr>
            ))}
            {kq.dong.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-gray-500">Không có nhật ký phù hợp</td></tr>}
          </tbody>
        </table>
      </div>
      {kq.soTrang > 1 && (
        <nav className="flex flex-wrap items-center justify-center gap-1 text-sm">
          {kq.trang > 1 && <Link href={linkTrang(kq.trang - 1)} className="rounded border bg-white px-2.5 py-1 hover:bg-gray-50">← Trước</Link>}
          <span className="px-2">Trang {kq.trang}/{kq.soTrang}</span>
          {kq.trang < kq.soTrang && <Link href={linkTrang(kq.trang + 1)} className="rounded border bg-white px-2.5 py-1 hover:bg-gray-50">Sau →</Link>}
        </nav>
      )}
    </div>
  );
}
