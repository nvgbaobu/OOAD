import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Quản lý nhà sách", template: "%s | Quản lý nhà sách" },
  description: "Phần mềm quản lý cửa hàng bán sách – Nhóm 09",
};

// Không dùng next/font/google: máy POS chạy nội bộ, có thể không có Internet khi build
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
