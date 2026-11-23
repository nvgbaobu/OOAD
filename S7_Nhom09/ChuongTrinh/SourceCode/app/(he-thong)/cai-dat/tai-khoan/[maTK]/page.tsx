import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { taiKhoanService } from "@/lib/services/taiKhoanService";
import { datLaiMatKhau, doiTrangThaiTaiKhoan } from "@/app/actions/caiDat";
import FormHanhDong from "@/app/components/FormHanhDong";
import FormMatKhau from "@/app/components/FormMatKhau";
import FormTaiKhoan from "../FormTaiKhoan";

export const metadata: Metadata = { title: "Tài khoản" };

export default async function TrangChiTietTaiKhoan({ params }: PageProps<"/cai-dat/tai-khoan/[maTK]">) {
  const nd = await yeuCauDangNhap("ADMIN");
  const ma = Number.parseInt((await params).maTK, 10);
  const tk = Number.isInteger(ma) ? await taiKhoanService.layChiTiet(ma) : null;
  if (!tk) notFound();
  const laMinh = tk.maTK === nd.maTK;
  const hoatDong = tk.trangThai === "HOAT_DONG";

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="mr-auto font-semibold">{tk.hoTen} {!hoatDong && <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">Đã khóa</span>}</h2>
        <Link href="/cai-dat/tai-khoan" className="text-sm text-blue-600 hover:underline">← Danh sách tài khoản</Link>
      </div>
      <section className="rounded-lg border bg-white p-4">
        <FormTaiKhoan maTK={tk.maTK} banDau={{ soDienThoai: tk.soDienThoai, hoTen: tk.hoTen, email: tk.email ?? "", vaiTro: tk.vaiTro }} />
      </section>
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-lg border bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold">{laMinh ? "Đổi mật khẩu của bạn" : "Đặt lại mật khẩu"}</h3>
          {laMinh
            ? <p className="text-sm">Dùng trang <Link href="/ca-nhan" className="text-blue-600 hover:underline">Tài khoản của tôi</Link> (cần mật khẩu hiện tại).</p>
            : <FormMatKhau action={datLaiMatKhau} maTK={tk.maTK} tenDangNhap={tk.soDienThoai} />}
        </section>
        <section className="rounded-lg border bg-white p-4 text-sm">
          <h3 className="mb-2 font-semibold">{hoatDong ? "Khóa tài khoản" : "Mở khóa tài khoản"}</h3>
          {laMinh ? <p className="text-gray-500">Không tự khóa tài khoản của chính mình.</p> : (
            <>
              <p className="mb-2 text-gray-600">
                {hoatDong
                  ? "Người dùng bị đăng xuất ở thao tác kế tiếp và không đăng nhập lại được. Đơn đang lập ở quầy (nếu có) bị hủy, sách tạm giữ được trả lại."
                  : "Người dùng đăng nhập lại được bằng mật khẩu hiện tại."}
              </p>
              <FormHanhDong action={doiTrangThaiTaiKhoan} xacNhan={hoatDong ? `Khóa tài khoản của ${tk.hoTen}?` : undefined}>
                <input type="hidden" name="maTK" value={tk.maTK} />
                <input type="hidden" name="khoa" value={hoatDong ? "1" : "0"} />
                <button className={`rounded px-3 py-1.5 text-white ${hoatDong ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}>
                  {hoatDong ? "Khóa tài khoản" : "Mở khóa"}
                </button>
              </FormHanhDong>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
