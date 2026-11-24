import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { khuyenMaiService, tinhTrang } from "@/lib/services/khuyenMaiService";
import { doiTrangThaiCombo, xoaCombo } from "@/app/actions/khuyenMai";
import FormHanhDong from "@/app/components/FormHanhDong";
import { ngayInput } from "@/lib/dinhDang";
import FormCombo from "../../FormCombo";
import NhanTinhTrang from "../../NhanTinhTrang";

export const metadata: Metadata = { title: "Combo" };

export default async function TrangSuaCombo({ params }: PageProps<"/khuyen-mai/combo/[maCombo]">) {
  await yeuCauDangNhap("ADMIN");
  const id = Number.parseInt((await params).maCombo, 10);
  const [c, sachs] = await Promise.all([Number.isInteger(id) ? khuyenMaiService.layCombo(id) : null, khuyenMaiService.sachDeChon()]);
  if (!c) notFound();
  const hoatDong = c.trangThai === "HOAT_DONG";
  // Sách trong combo đã ngừng kinh doanh vẫn hiện để Admin bỏ ra (lưu sẽ báo lỗi dòng đó)
  const dsChon = [...sachs, ...c.chiTiets.filter((x) => x.sach.trangThai !== "DANG_BAN").map((x) => ({ maSach: x.sach.maSach, tenSach: `${x.sach.tenSach} (ngừng KD)`, giaBan: Number(x.sach.giaBan) }))];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="mr-auto text-lg font-semibold">{c.tenCombo} <NhanTinhTrang t={tinhTrang(c)} /></h1>
        <Link href="/khuyen-mai#combo" className="text-sm text-blue-600 hover:underline">← Khuyến mãi</Link>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3 rounded-lg border bg-white p-3 text-sm">
        <FormHanhDong action={doiTrangThaiCombo}>
          <input type="hidden" name="maCombo" value={c.maCombo} />
          <input type="hidden" name="hoatDong" value={hoatDong ? "0" : "1"} />
          <button className={`rounded border px-3 py-1 ${hoatDong ? "border-orange-300 text-orange-700 hover:bg-orange-50" : "border-green-300 text-green-700 hover:bg-green-50"}`}>
            {hoatDong ? "Ngừng hoạt động" : "Hoạt động lại"}
          </button>
        </FormHanhDong>
        <FormHanhDong action={xoaCombo} xacNhan={`Xóa combo "${c.tenCombo}"? Hóa đơn cũ không bị ảnh hưởng.`}>
          <input type="hidden" name="maCombo" value={c.maCombo} />
          <button className="rounded border border-red-300 px-3 py-1 text-red-700 hover:bg-red-50">Xóa</button>
        </FormHanhDong>
      </div>
      <div className="rounded-lg border bg-white p-4">
        <FormCombo sachs={dsChon} maCombo={c.maCombo} banDau={{
          tenCombo: c.tenCombo, giaCombo: String(Number(c.giaCombo)), ngayBatDau: ngayInput(c.ngayBatDau), ngayKetThuc: ngayInput(c.ngayKetThuc),
          dong: c.chiTiets.map((x) => ({ maSach: x.maSach, soLuong: String(x.soLuong) })),
        }} />
      </div>
    </div>
  );
}
