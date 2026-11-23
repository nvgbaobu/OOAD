import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tắt Cache Components: app POS nội bộ, mọi trang đều là dữ liệu động theo người dùng/DB
  // → render động mỗi request, không cần <Suspense>/'use cache' cho mỗi lần đọc cookie.
  cacheComponents: false,
  // pdfkit đọc file font .afm từ node_modules lúc chạy → không bundle (UC9.3 xuất PDF)
  serverExternalPackages: ["pdfkit"],
  // font tiếng Việt cho PDF nằm ở lib/fonts → kèm vào bản build standalone/route
  outputFileTracingIncludes: { "/bao-cao/pdf": ["./lib/fonts/**"] },
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
