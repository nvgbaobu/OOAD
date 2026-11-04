import type { Metadata } from "next";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { khoService } from "@/lib/services/khoService";
import { lapPhieu } from "@/app/actions/kho";
import FormPhieuKho from "../../FormPhieuKho";

export const metadata: Metadata = { title: "Lập phiếu nhập" };

export default async function TrangLapPhieuNhap({ searchParams }: PageProps<"/kho/phieu-nhap/tao">) {
  await yeuCauDangNhap("ADMIN", "STAFF");
  const [sachs, nhaCungCaps, sp] = await Promise.all([khoService.sachDeChon(), khoService.nhaCungCapDeChon(), searchParams]);
  // ?sapHet=1 (từ trang Tồn kho): thêm sẵn các sách đang bán có tồn ≤ định mức
  const chonSan = sp.sapHet === "1" ? sachs.filter((s) => s.trangThai === "DANG_BAN" && s.soLuongTon <= s.dinhMucToiThieu).map((s) => s.maSach) : [];
  return (
    <div className="mx-auto max-w-5xl space-y-3">
      <h1 className="text-lg font-semibold">Lập phiếu nhập</h1>
      <p className="rounded bg-blue-50 p-3 text-sm text-blue-900">
        Chọn nhà cung cấp và sách cần nhập. Giá nhập mặc định là giá nhập hiện tại của sách và không được cao hơn giá bán.
        Tồn kho được cộng và giá nhập của sách được cập nhật theo phiếu <b>sau khi Admin duyệt</b>.
      </p>
      <FormPhieuKho loai="phieu-nhap" sachs={sachs} nhaCungCaps={nhaCungCaps} chonSan={chonSan} action={lapPhieu.bind(null, "phieu-nhap")} />
    </div>
  );
}
