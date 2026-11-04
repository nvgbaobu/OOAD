"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { luuCombo } from "@/app/actions/khuyenMai";

export type SachCombo = { maSach: number; tenSach: string; giaBan: number };
type Dong = { maSach: number; soLuong: string };

const oNhap = "rounded border px-2 py-1.5 text-sm aria-[invalid=true]:border-red-500";
const tien = (n: number) => `${n.toLocaleString("vi-VN")}đ`;

/** Form thêm/sửa combo: thông tin + các dòng sách (giữ trong state → báo lỗi không mất dữ liệu). */
export default function FormCombo({ sachs, banDau, maCombo }: {
  sachs: SachCombo[]; maCombo?: number;
  banDau: { tenCombo: string; giaCombo: string; ngayBatDau: string; ngayKetThuc: string; dong: Dong[] };
}) {
  const [state, action, pending] = useActionState(luuCombo, undefined);
  const theoMa = useMemo(() => new Map(sachs.map((s) => [s.maSach, s])), [sachs]);
  const [dong, setDong] = useState<Dong[]>(banDau.dong);
  const [tt, setTt] = useState({ tenCombo: banDau.tenCombo, giaCombo: banDau.giaCombo, ngayBatDau: banDau.ngayBatDau, ngayKetThuc: banDau.ngayKetThuc });
  const [chon, setChon] = useState("");
  const loi = state?.loiTruong ?? {};

  const giaLe = dong.reduce((t, d) => t + (theoMa.get(d.maSach)?.giaBan ?? 0) * (Number(d.soLuong) || 0), 0);
  const tietKiem = giaLe - (Number(tt.giaCombo) || 0);
  const oTT = (ten: keyof typeof tt, nhan: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{nhan}<span className="text-red-600"> *</span></span>
      <input name={ten} value={tt[ten]} onChange={(e) => setTt({ ...tt, [ten]: e.target.value })} aria-invalid={!!loi[ten]} className={`${oNhap} w-full`} {...props} />
      {loi[ten] && <span className="mt-0.5 block text-xs text-red-600">{loi[ten]}</span>}
    </label>
  );

  return (
    <form action={action} className="space-y-4">
      {maCombo && <input type="hidden" name="maCombo" value={maCombo} />}
      {state?.loi && <p role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{state.loi}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">{oTT("tenCombo", "Tên combo", { placeholder: "VD: Combo Nguyễn Nhật Ánh" })}</div>
        {oTT("ngayBatDau", "Từ ngày", { type: "date" })}
        {oTT("ngayKetThuc", "Đến hết ngày", { type: "date" })}
      </div>

      <div className="rounded-lg border">
        <div className="flex flex-wrap gap-2 border-b bg-gray-50 p-2">
          <select aria-label="Chọn sách" value={chon} onChange={(e) => setChon(e.target.value)} className={`${oNhap} min-w-64 flex-1`}>
            <option value="">— Chọn sách đang bán —</option>
            {sachs.filter((s) => !dong.some((d) => d.maSach === s.maSach)).map((s) => (
              <option key={s.maSach} value={s.maSach}>{s.tenSach} · {tien(s.giaBan)}</option>
            ))}
          </select>
          <button type="button" disabled={!chon} onClick={() => { setDong([...dong, { maSach: Number(chon), soLuong: "1" }]); setChon(""); }}
            className="rounded bg-gray-800 px-3 py-1 text-sm text-white disabled:opacity-40">+ Thêm sách</button>
        </div>
        <table className="w-full text-sm [&_td]:px-3 [&_td]:py-1.5 [&_th]:px-3">
          <thead className="text-left text-gray-600"><tr><th className="py-2">Sách</th><th className="text-right">Giá lẻ</th><th className="w-24">SL / bộ</th><th className="text-right">Thành tiền</th><th /></tr></thead>
          <tbody>
            {dong.map((d, i) => {
              const s = theoMa.get(d.maSach);
              const l = loi[`dong.${d.maSach}`];
              return (
                <tr key={d.maSach} className="border-t align-top">
                  <td>
                    <input type="hidden" name="maSach" value={d.maSach} />
                    {s?.tenSach ?? `Sách #${d.maSach} (đã ngừng kinh doanh)`}
                    {l && <div className="text-xs text-red-600">{l}</div>}
                  </td>
                  <td className="text-right">{s ? tien(s.giaBan) : "–"}</td>
                  <td>
                    <input name="soLuong" type="number" min={1} max={20} value={d.soLuong} aria-label="Số lượng" aria-invalid={!!l}
                      onChange={(e) => setDong(dong.map((x, j) => (j === i ? { ...x, soLuong: e.target.value } : x)))} className={`${oNhap} w-20`} />
                  </td>
                  <td className="text-right">{s ? tien(s.giaBan * (Number(d.soLuong) || 0)) : "–"}</td>
                  <td className="text-right"><button type="button" onClick={() => setDong(dong.filter((_, j) => j !== i))} className="text-red-600 hover:underline">Bỏ</button></td>
                </tr>
              );
            })}
            {dong.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-gray-500">Chưa có sách</td></tr>}
          </tbody>
        </table>
        {loi.dong && <p className="px-3 pb-2 text-xs text-red-600">{loi.dong}</p>}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="w-56">{oTT("giaCombo", "Giá combo / bộ (đồng)", { type: "number", min: 0, step: 1000 })}</div>
        <p className="pb-2 text-sm">
          Tổng giá lẻ 1 bộ: <b>{tien(giaLe)}</b>
          {tietKiem > 0 && Number(tt.giaCombo) > 0 && <> · Khách tiết kiệm <b className="text-green-700">{tien(tietKiem)}</b> ({Math.round((tietKiem / giaLe) * 100)}%) / bộ</>}
        </p>
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
          {pending ? "Đang lưu..." : maCombo ? "Lưu thay đổi" : "Thêm combo"}
        </button>
        <Link href="/khuyen-mai#combo" className="rounded border px-4 py-2 text-sm hover:bg-gray-50">Hủy</Link>
      </div>
    </form>
  );
}
