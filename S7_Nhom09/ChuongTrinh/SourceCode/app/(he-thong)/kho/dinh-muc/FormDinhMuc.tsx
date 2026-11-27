"use client";

import { useActionState, useState } from "react";
import { datDinhMuc } from "@/app/actions/sach";

type DongSach = { maSach: number; tenSach: string; isbn: string; tenTL: string; soLuongTon: number; dinhMucToiThieu: number };

/** UC4.2 – chọn một hoặc nhiều sách rồi đặt định mức tồn kho tối thiểu một lần. */
export default function FormDinhMuc({ sachs }: { sachs: DongSach[] }) {
  const [state, action, pending] = useActionState(datDinhMuc, undefined);
  const [chon, setChon] = useState<Set<number>>(new Set());
  const tatCa = sachs.length > 0 && chon.size === sachs.length;
  const dao = (ma: number) => setChon((c) => { const m = new Set(c); if (m.has(ma)) m.delete(ma); else m.add(ma); return m; });

  return (
    <form action={action} className="space-y-3">
      <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-white p-3">
        <label className="text-sm">
          <span className="block text-gray-600">Định mức tồn tối thiểu (cuốn)</span>
          <input name="dinhMuc" type="number" min={0} max={10000} step={1} defaultValue={state?.duLieu?.dinhMuc ?? "5"}
            className="mt-1 w-40 rounded border px-2 py-1" />
        </label>
        <button disabled={pending || chon.size === 0} className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
          Thiết lập định mức cho {chon.size} sách đã chọn
        </button>
        {state?.loiTruong?.dinhMuc && <p className="basis-full text-sm text-red-600">{state.loiTruong.dinhMuc}</p>}
        {state?.loi && !state.loiTruong && <p role="alert" className="basis-full text-sm text-red-600">{state.loi}</p>}
        {state?.thongBao && <p role="status" className="basis-full text-sm text-green-700">✓ {state.thongBao}</p>}
      </div>
      <table className="w-full rounded-lg border bg-white text-sm [&_td]:px-3 [&_td]:py-1.5 [&_th]:px-3">
        <thead className="bg-gray-50 text-left text-gray-600">
          <tr>
            <th className="w-8 py-2"><input type="checkbox" aria-label="Chọn tất cả" checked={tatCa}
              onChange={() => setChon(tatCa ? new Set() : new Set(sachs.map((s) => s.maSach)))} /></th>
            <th>Sách</th><th>Thể loại</th><th className="text-right">Tồn</th><th className="text-right">Định mức hiện tại</th>
          </tr>
        </thead>
        <tbody>
          {sachs.map((s) => (
            <tr key={s.maSach} className={`border-t ${chon.has(s.maSach) ? "bg-blue-50" : ""}`}>
              <td><input type="checkbox" name="maSach" value={s.maSach} checked={chon.has(s.maSach)} onChange={() => dao(s.maSach)} aria-label={`Chọn ${s.tenSach}`} /></td>
              <td>{s.tenSach}<div className="text-xs text-gray-500">ISBN {s.isbn}</div></td>
              <td>{s.tenTL}</td>
              <td className={`text-right ${s.soLuongTon <= s.dinhMucToiThieu ? "font-semibold text-orange-600" : ""}`}>{s.soLuongTon}</td>
              <td className="text-right">{s.dinhMucToiThieu}</td>
            </tr>
          ))}
          {sachs.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-gray-500">Không tìm thấy sách</td></tr>}
        </tbody>
      </table>
    </form>
  );
}
