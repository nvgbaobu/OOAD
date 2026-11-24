import { yeuCauDangNhap } from "@/lib/auth/dal";
import TabCaiDat from "./TabCaiDat";

export default async function LayoutCaiDat({ children }: LayoutProps<"/cai-dat">) {
  await yeuCauDangNhap("ADMIN");
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Cài đặt hệ thống</h1>
      <TabCaiDat />
      {children}
    </div>
  );
}
