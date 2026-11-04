"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import type { KetQuaForm } from "@/lib/ketQuaForm";

export type SachChon = {
  maSach: number; tenSach: string; isbn: string; viTriKe: string | null;
  soLuongTon: number; soLuongTamGiu: number; trangThai: string;
  dinhMucToiThieu: number; giaNhap: number; giaBan: number;
};
type Dong = { maSach: number; soLuong: string; lyDo: string; giaNhap: string };
type Loai = "phieu-nhap" | "kiem-ke" | "xuat-huy";

const oNhap = "rounded border px-2 py-1 text-sm aria-[invalid=true]:border-red-500";
const ke = (s: SachChon) => s.viTriKe?.split("-")[0] ?? "";
const tien = (n: number) => `${n.toLocaleString("vi-VN")}đ`;

/**
 * Form lập phiếu kho nhiều dòng.
 * - phieu-nhap: chọn NCC; mỗi dòng SL nhập + giá nhập (mặc định giá nhập hiện tại của sách); hiện thành tiền, tổng.
 * - kiem-ke: mỗi dòng nhập SL thực tế (mặc định = tồn hệ thống), lệch thì bắt buộc lý do.
 * - xuat-huy: mỗi dòng nhập SL hủy (≤ còn bán) + lý do.
 * Các dòng giữ trong state nên báo lỗi không làm mất dữ liệu đã nhập.
 */
export default function FormPhieuKho({
  loai, sachs, action, nhaCungCaps = [], chonSan = [],
}: {
  loai: Loai;
  sachs: SachChon[];
  action: (state: KetQuaForm, fd: FormData) => Promise<KetQuaForm>;
  nhaCungCaps?: { maNCC: number; tenNCC: string }[];
  chonSan?: number[]; // maSach thêm sẵn khi mở form (vd: nhập hàng cho sách sắp hết)
}) {
  const kiemKe = loai === "kiem-ke";
  const nhap = loai === "phieu-nhap";
  const dongMoi = (s: SachChon): Dong => ({
    maSach: s.maSach,
    soLuong: kiemKe ? String(s.soLuongTon) : nhap ? String(Math.max(1, s.dinhMucToiThieu * 2 - s.soLuongTon)) : "1",
    lyDo: "",
    giaNhap: String(s.giaNhap),
  });

  const theoMa = useMemo(() => new Map(sachs.map((s) => [s.maSach, s])), [sachs]);
  const [state, formAction, pending] = useActionState(action, undefined);
  const [dong, setDong] = useState<Dong[]>(() => chonSan.flatMap((m) => (theoMa.has(m) ? [dongMoi(theoMa.get(m)!)] : [])));
  const [maNCC, setMaNCC] = useState("");
  const [ghiChu, setGhiChu] = useState("");
  const [tuKhoa, setTuKhoa] = useState("");
  const [chon, setChon] = useState("");
  const loi = state?.loiTruong ?? {};

  const daCo = new Set(dong.map((d) => d.maSach));
  const coTheChon = sachs.filter((s) =>
    !daCo.has(s.maSach) && (kiemKe || (nhap ? s.trangThai === "DANG_BAN" : s.soLuongTon - s.soLuongTamGiu > 0)));
  const tk = tuKhoa.trim().toLowerCase();
  const goiY = tk ? coTheChon.filter((s) => s.tenSach.toLowerCase().includes(tk) || s.isbn.includes(tk)) : coTheChon;
  const cacKe = [...new Set(sachs.map(ke).filter(Boolean))].sort();
  const tongTien = dong.reduce((t, d) => t + (Number(d.soLuong) || 0) * (Number(d.giaNhap) || 0), 0);

  const them = (ds: SachChon[]) => setDong((cu) => [...cu, ...ds.filter((s) => !cu.some((d) => d.maSach === s.maSach)).map(dongMoi)]);
  const sua = (i: number, gt: Partial<Dong>) => setDong((cu) => cu.map((d, j) => (j === i ? { ...d, ...gt } : d)));
  const xoa = (i: number) => setDong((cu) => cu.filter((_, j) => j !== i));

  return (
    <form action={formAction} className="space-y-3">
      {state?.loi && <p role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{state.loi}</p>}

      {nhap && (
        <label className="block rounded-lg border bg-white p-3 text-sm">
          <span className="mb-1 block font-medium">Nhà cung cấp<span className="text-red-600"> *</span></span>
          <select name="maNCC" value={maNCC} onChange={(e) => setMaNCC(e.target.value)} aria-invalid={!!loi.maNCC} className={`${oNhap} w-full sm:w-96`}>
            <option value="">— Chọn nhà cung cấp đang giao dịch —</option>
            {nhaCungCaps.map((n) => <option key={n.maNCC} value={n.maNCC}>{n.tenNCC}</option>)}
          </select>
          {loi.maNCC && <span className="mt-0.5 block text-xs text-red-600">{loi.maNCC}</span>}
        </label>
      )}

      <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-white p-3">
        <label className="text-sm">
          <span className="mb-1 block font-medium">Tìm sách</span>
          <input value={tuKhoa} onChange={(e) => setTuKhoa(e.target.value)} placeholder="Tên hoặc ISBN" className={`${oNhap} w-48`} />
        </label>
        <select aria-label="Chọn sách" value={chon} onChange={(e) => setChon(e.target.value)} className={`${oNhap} min-w-72 flex-1`}>
          <option value="">— Chọn sách ({goiY.length}) —</option>
          {goiY.map((s) => (
            <option key={s.maSach} value={s.maSach}>
              {s.tenSach} · tồn {s.soLuongTon}{s.soLuongTamGiu ? `, giữ ${s.soLuongTamGiu}` : ""}{s.viTriKe ? ` · kệ ${s.viTriKe}` : ""}
            </option>
          ))}
        </select>
        <button type="button" disabled={!chon} onClick={() => { const s = theoMa.get(Number(chon)); if (s) them([s]); setChon(""); }}
          className="rounded bg-gray-800 px-3 py-1 text-sm text-white hover:bg-gray-700 disabled:opacity-40">
          + Thêm
        </button>
        {kiemKe && (
          <select aria-label="Thêm cả kệ" value=""
            onChange={(e) => them(sachs.filter((s) => ke(s) === e.target.value).sort((a, b) => (a.viTriKe ?? "").localeCompare(b.viTriKe ?? "")))}
            className={oNhap}>
            <option value="">+ Thêm cả kệ...</option>
            {cacKe.map((k) => <option key={k} value={k}>Kệ {k} ({sachs.filter((s) => ke(s) === k).length} sách)</option>)}
          </select>
        )}
        {nhap && (
          <button type="button" className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
            onClick={() => them(sachs.filter((s) => s.trangThai === "DANG_BAN" && s.soLuongTon <= s.dinhMucToiThieu))}>
            + Thêm sách sắp hết
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[760px] text-sm [&_td]:px-2 [&_td]:py-1.5 [&_th]:px-2">
          <thead className="border-b bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="py-2">Sách</th>
              <th className="text-right">Tồn hệ thống</th>
              {kiemKe && <><th className="w-28">SL thực tế</th><th className="text-right">Chênh lệch</th><th>Lý do chênh lệch</th></>}
              {loai === "xuat-huy" && <><th className="text-right">Có thể hủy</th><th className="w-28">SL hủy</th><th>Lý do hủy</th></>}
              {nhap && <><th className="w-28">SL nhập</th><th className="w-36">Giá nhập (đ)</th><th className="text-right">Thành tiền</th></>}
              <th />
            </tr>
          </thead>
          <tbody>
            {dong.map((d, i) => {
              const s = theoMa.get(d.maSach)!;
              const l = loi[`dong.${d.maSach}`];
              const chenh = Number(d.soLuong) - s.soLuongTon;
              const oSoLuong = (
                <td>
                  <input name="soLuong" type="number" min={kiemKe ? 0 : 1} value={d.soLuong} aria-invalid={!!l} aria-label="Số lượng"
                    onChange={(e) => sua(i, { soLuong: e.target.value })} className={`${oNhap} w-24`} />
                </td>
              );
              const oLyDo = (
                <td>
                  <input name="lyDo" value={d.lyDo} onChange={(e) => sua(i, { lyDo: e.target.value })} aria-label="Lý do"
                    placeholder={kiemKe ? (chenh !== 0 ? "Bắt buộc khi lệch" : "") : "VD: rách bìa, ẩm mốc"} className={`${oNhap} w-full`} />
                </td>
              );
              return (
                <tr key={d.maSach} className="border-b align-top last:border-0">
                  <td>
                    <input type="hidden" name="maSach" value={d.maSach} />
                    <div className="font-medium">{s.tenSach}</div>
                    <div className="text-xs text-gray-500">
                      ISBN {s.isbn}{s.viTriKe && ` · kệ ${s.viTriKe}`}{nhap && ` · giá bán ${tien(s.giaBan)}`}
                    </div>
                    {l && <div className="text-xs text-red-600">{l}</div>}
                  </td>
                  <td className="text-right">{s.soLuongTon}</td>
                  {kiemKe && (
                    <>
                      {oSoLuong}
                      <td className={`text-right font-medium ${chenh > 0 ? "text-green-700" : chenh < 0 ? "text-red-600" : "text-gray-400"}`}>
                        {d.soLuong === "" ? "" : chenh > 0 ? `+${chenh}` : chenh}
                      </td>
                      {oLyDo}
                    </>
                  )}
                  {loai === "xuat-huy" && <><td className="text-right">{s.soLuongTon - s.soLuongTamGiu}</td>{oSoLuong}{oLyDo}</>}
                  {nhap && (
                    <>
                      {oSoLuong}
                      <td>
                        <input name="giaNhap" type="number" min={0} step={1} value={d.giaNhap} aria-invalid={!!l} aria-label="Giá nhập"
                          onChange={(e) => sua(i, { giaNhap: e.target.value })} className={`${oNhap} w-32`} />
                      </td>
                      <td className="text-right">{tien((Number(d.soLuong) || 0) * (Number(d.giaNhap) || 0))}</td>
                    </>
                  )}
                  <td className="text-right">
                    <button type="button" onClick={() => xoa(i)} className="text-red-600 hover:underline">Bỏ</button>
                  </td>
                </tr>
              );
            })}
            {dong.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-gray-500">Chưa có sách – chọn sách ở trên để thêm</td></tr>}
          </tbody>
        </table>
        {/* Tổng đặt ngoài <table>: dùng <tfoot> khi có dòng render sẵn từ server (chonSan) bị lỗi hydration */}
        {nhap && dong.length > 0 && (
          <div className="flex justify-end gap-6 border-t bg-gray-50 px-3 py-2 text-sm font-semibold">
            <span>{dong.length} sách · {dong.reduce((t, d) => t + (Number(d.soLuong) || 0), 0)} cuốn</span>
            <span>Tổng tiền: {tien(tongTien)}</span>
          </div>
        )}
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Ghi chú</span>
        <textarea name="ghiChu" value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} rows={2} aria-invalid={!!loi.ghiChu} className={`${oNhap} w-full`} />
        {loi.ghiChu && <span className="text-xs text-red-600">{loi.ghiChu}</span>}
      </label>

      <div className="flex gap-2">
        <button disabled={pending || dong.length === 0} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {pending ? "Đang gửi..." : "Lập phiếu (gửi duyệt)"}
        </button>
        <Link href={`/kho/${loai}`} className="rounded border px-4 py-2 text-sm hover:bg-gray-50">Hủy</Link>
      </div>
    </form>
  );
}
