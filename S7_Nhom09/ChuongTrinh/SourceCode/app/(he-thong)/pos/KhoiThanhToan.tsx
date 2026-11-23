"use client";

import { useActionState, useState } from "react";
import { thanhToan } from "@/app/actions/pos";
import { tienVND } from "@/lib/dinhDang";

const TEN: Record<string, string> = { TIEN_MAT: "Tiền mặt", QUET_THE: "Quẹt thẻ", MA_QR: "Mã QR" };

export default function KhoiThanhToan({ tongTien, phuongThuc }: { tongTien: number; phuongThuc: string[] }) {
  const [state, action, pending] = useActionState(thanhToan, undefined);
  const [pt, setPt] = useState(phuongThuc[0] ?? "");
  const [tienDua, setTienDua] = useState("");
  const soTienDua = Number(tienDua.replace(/\D/g, "")) || 0;
  const goiY = [...new Set([tongTien, ...[50000, 100000, 200000, 500000].map((m) => Math.ceil(tongTien / m) * m)])].slice(0, 4);

  if (phuongThuc.length === 0) return <p className="text-sm text-red-600">Chưa bật phương thức thanh toán nào (Cài đặt).</p>;

  return (
    <form action={action} className="space-y-3">
      <div className="flex gap-2">
        {phuongThuc.map((p) => (
          <label key={p} className={`flex-1 cursor-pointer rounded border px-2 py-1.5 text-center text-sm ${pt === p ? "border-blue-600 bg-blue-50 font-medium" : ""}`}>
            <input type="radio" name="phuongThucTT" value={p} checked={pt === p} onChange={() => setPt(p)} className="sr-only" />
            {TEN[p]}
          </label>
        ))}
      </div>

      {pt === "TIEN_MAT" && (
        <div className="space-y-2">
          <label className="block text-sm">
            Tiền khách đưa
            <input
              name="tienKhachDua" inputMode="numeric" value={tienDua} placeholder="0"
              onChange={(e) => { const s = e.target.value.replace(/\D/g, ""); setTienDua(s ? Number(s).toLocaleString("vi-VN") : ""); }}
              className="mt-1 w-full rounded border px-2 py-1.5 text-right text-lg"
            />
          </label>
          <div className="flex flex-wrap gap-1">
            {goiY.map((g) => (
              <button key={g} type="button" onClick={() => setTienDua(g.toLocaleString("vi-VN"))} className="rounded border px-2 py-0.5 text-xs hover:bg-gray-50">
                {tienVND(g)}
              </button>
            ))}
          </div>
          <p className="flex justify-between text-sm">
            <span>Tiền thừa</span>
            <span className={soTienDua >= tongTien ? "font-semibold text-green-700" : "text-gray-400"}>
              {soTienDua >= tongTien ? tienVND(soTienDua - tongTien) : "—"}
            </span>
          </p>
        </div>
      )}

      {state?.loi && <p role="alert" className="text-sm text-red-600">{state.loi}</p>}
      <button
        type="submit" disabled={pending || (pt === "TIEN_MAT" && soTienDua < tongTien)}
        className="w-full rounded bg-green-600 py-2.5 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
      >
        {pending ? "Đang thanh toán..." : `Thanh toán ${tienVND(tongTien)}`}
      </button>
    </form>
  );
}
