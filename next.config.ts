import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tắt Cache Components: app POS nội bộ, mọi trang đều là dữ liệu động theo người dùng/DB
  // → render động mỗi request, không cần <Suspense>/'use cache' cho mỗi lần đọc cookie.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
