"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TAB = [
  { href: "/cai-dat", ten: "Cửa hàng & thanh toán" },
  { href: "/cai-dat/tai-khoan", ten: "Tài khoản" },
  { href: "/cai-dat/nhat-ky", ten: "Nhật ký hệ thống" },
  { href: "/cai-dat/sao-luu", ten: "Sao lưu dữ liệu" },
];

export default function TabCaiDat() {
  const duongDan = usePathname();
  return (
    <nav className="flex flex-wrap gap-1 border-b text-sm">
      {TAB.map((t) => {
        const chon = t.href === "/cai-dat" ? duongDan === t.href : duongDan.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} aria-current={chon ? "page" : undefined}
            className={`-mb-px rounded-t border px-3 py-1.5 ${chon ? "border-b-gray-50 bg-gray-50 font-medium" : "border-transparent text-gray-600 hover:text-gray-900"}`}>
            {t.ten}
          </Link>
        );
      })}
    </nav>
  );
}
