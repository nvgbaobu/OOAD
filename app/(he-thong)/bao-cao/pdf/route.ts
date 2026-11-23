// GET /bao-cao/pdf?tuNgay=YYYY-MM-DD&denNgay=YYYY-MM-DD → tải file báo cáo doanh thu .pdf (chỉ Admin) – UC9.3.
import type { NextRequest } from "next/server";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { docKhoangNgay } from "@/lib/services/baoCaoService";
import { taoFilePdfBaoCao } from "@/lib/services/xuatPdfBaoCao";
import { nhatKyRepository } from "@/lib/repositories/nhatKyRepository";

export async function GET(request: NextRequest) {
  const nd = await yeuCauDangNhap("ADMIN");
  const sp = request.nextUrl.searchParams;
  const k = docKhoangNgay(sp.get("tuNgay") ?? undefined, sp.get("denNgay") ?? undefined);
  const file = await taoFilePdfBaoCao(k, nd.hoTen);
  await nhatKyRepository.ghi({ maTK: nd.maTK, module: "BAO_CAO", hanhDong: "XUAT_PDF", noiDung: `Doanh thu ${k.tuNgay} → ${k.denNgay}` });
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="bao-cao-doanh-thu_${k.tuNgay}_${k.denNgay}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
