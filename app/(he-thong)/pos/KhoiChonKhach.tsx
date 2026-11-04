"use client";

import { useActionState, useState } from "react";
import { chonKhachHang, taoNhanhKhachHang } from "@/app/actions/pos";

const oNhap = "rounded border px-2 py-1.5 text-sm";
const nut = "rounded border px-2 py-0.5 text-sm hover:bg-gray-100 disabled:opacity-40";

/** Nhập SĐT khách; nếu chưa đăng ký → form tạo nhanh (SĐT có sẵn + họ tên), lưu xong gắn vào đơn. */
export default function KhoiChonKhach() {
  const [kqChon, chon, dangChon] = useActionState(chonKhachHang, undefined);
  const [kqTao, tao, dangTao] = useActionState(taoNhanhKhachHang, undefined);
  const [boQua, setBoQua] = useState<object | null>(null); // ẩn form tạo nhanh cho đúng lần tra cứu này

  const sdtMoi = kqChon?.chuaDangKy && boQua !== kqChon ? kqChon.chuaDangKy : null;

  return (
    <div className="space-y-2">
      <form action={chon} className="flex flex-wrap gap-2">
        <fieldset disabled={dangChon} className="contents">
          <input name="soDienThoai" inputMode="numeric" defaultValue={kqChon?.chuaDangKy}
            placeholder="SĐT khách thành viên (bỏ trống nếu khách lẻ)" className={`${oNhap} flex-1`} />
          <button className={nut}>Chọn</button>
        </fieldset>
        {kqChon?.loi && !sdtMoi && <p role="alert" className="basis-full text-sm text-red-600">{kqChon.loi}</p>}
      </form>

      {sdtMoi && (
        <form action={tao} className="space-y-2 rounded border border-blue-200 bg-blue-50 p-2 text-sm">
          <p>SĐT <b>{sdtMoi}</b> chưa đăng ký. Tạo nhanh thành viên mới:</p>
          <input type="hidden" name="soDienThoai" value={sdtMoi} />
          <fieldset disabled={dangTao} className="flex flex-wrap gap-2">
            <input name="hoTen" autoFocus placeholder="Họ tên khách hàng" className={`${oNhap} flex-1 bg-white`} />
            <button className="rounded bg-blue-600 px-2 py-1 text-white hover:bg-blue-700">Tạo & chọn</button>
            <button type="button" onClick={() => setBoQua(kqChon!)} className={nut}>Bỏ qua</button>
          </fieldset>
          {kqTao?.loi && <p role="alert" className="text-red-600">{kqTao.loi}</p>}
        </form>
      )}
    </div>
  );
}
