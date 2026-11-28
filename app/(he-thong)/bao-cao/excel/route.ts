// GET /bao-cao/excel?tuNgay=YYYY-MM-DD&denNgay=YYYY-MM-DD → tải file báo cáo doanh thu .xlsx (chỉ Admin).
import type { NextRequest } from "next/server";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { baoCaoService, docKhoangNgay } from "@/lib/services/baoCaoService";
import { taoFileExcelBaoCao } from "@/lib/services/xuatExcelBaoCao";

export async function GET(request: NextRequest) {
  const nd = await yeuCauDangNhap("ADMIN");
  const sp = request.nextUrl.searchParams;
  const k = docKhoangNgay(sp.get("tuNgay") ?? undefined, sp.get("denNgay") ?? undefined);
  if (k.loi) return new Response(k.loi, { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const file = await taoFileExcelBaoCao(k, nd.hoTen);
  await baoCaoService.ghiNhatKyXuat(nd.maTK, "XUAT_EXCEL", k);
  const tenFile = `bao-cao-doanh-thu_${k.tuNgay}_${k.denNgay}.xlsx`;
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${tenFile}"`,
      "Cache-Control": "no-store",
    },
  });
}
