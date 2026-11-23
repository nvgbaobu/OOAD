# Image chạy demo: build Next.js, khi khởi động tự chạy `prisma migrate deploy` rồi `next start`.
FROM node:22-bookworm-slim
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# prisma generate cần DATABASE_URL hợp lệ về cú pháp (không kết nối DB)
RUN DATABASE_URL="sqlserver://localhost:1433;database=x;user=sa;password=x;trustServerCertificate=true" npx prisma generate \
 && npm run build
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
