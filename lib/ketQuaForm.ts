import { LoiNghiepVu } from "@/lib/loi";

/** Kết quả trả về cho form (useActionState). duLieu = giá trị vừa gửi, để điền lại form khi lỗi. */
export type KetQuaForm = { loi?: string; loiTruong?: Record<string, string>; duLieu?: Record<string, string> } | undefined;

/** Lấy toàn bộ ô dạng chuỗi từ FormData (bỏ các trường nội bộ $ACTION_ của Next). */
export function docForm(fd: FormData): Record<string, string> {
  const kq: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (!k.startsWith("$") && typeof v === "string") kq[k] = v;
  return kq;
}

/** Chạy nghiệp vụ; LoiNghiepVu → { loi, loiTruong, duLieu }. Lỗi khác ném tiếp. */
export async function batLoiNghiepVu(fn: () => Promise<unknown>, duLieu?: Record<string, string>): Promise<KetQuaForm> {
  try {
    await fn();
    return undefined;
  } catch (e) {
    if (e instanceof LoiNghiepVu) return { loi: e.message, loiTruong: e.loiTruong, duLieu };
    throw e;
  }
}
