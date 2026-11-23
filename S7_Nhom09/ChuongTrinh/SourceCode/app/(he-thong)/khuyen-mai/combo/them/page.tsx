import type { Metadata } from "next";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { khuyenMaiService } from "@/lib/services/khuyenMaiService";
import { ngayInput } from "@/lib/dinhDang";
import FormCombo from "../../FormCombo";

export const metadata: Metadata = { title: "Thêm combo" };

export default async function TrangThemCombo() {
  await yeuCauDangNhap("ADMIN");
  const sau30 = new Date(); sau30.setDate(sau30.getDate() + 30);
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <h1 className="text-lg font-semibold">Thêm combo sách</h1>
      <div className="rounded-lg border bg-white p-4">
        <FormCombo sachs={await khuyenMaiService.sachDeChon()}
          banDau={{ tenCombo: "", giaCombo: "", ngayBatDau: ngayInput(new Date()), ngayKetThuc: ngayInput(sau30), dong: [] }} />
      </div>
    </div>
  );
}
