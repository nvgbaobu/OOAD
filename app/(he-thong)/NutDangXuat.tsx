"use client";

import { dangXuat } from "@/app/actions/auth";

/** UC1.2: còn đơn đang lập thì cảnh báo; đồng ý → đơn nháp bị hủy, sách trả về kho. */
export default function NutDangXuat({ soSachDangLap }: { soSachDangLap: number }) {
  return (
    <form
      action={dangXuat}
      onSubmit={(e) => {
        if (soSachDangLap > 0 && !confirm(
          `Đơn hàng chưa hoàn tất (${soSachDangLap} đầu sách). Đăng xuất sẽ hủy đơn và trả sách về kho. Tiếp tục?`,
        )) e.preventDefault();
      }}
    >
      <button type="submit" className="rounded border px-2 py-1 hover:bg-gray-50">Đăng xuất</button>
    </form>
  );
}
