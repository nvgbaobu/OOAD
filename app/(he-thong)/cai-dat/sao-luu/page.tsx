import type { Metadata } from "next";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { caiDatService, THU_MUC_SAO_LUU } from "@/lib/services/caiDatService";
import { saoLuuCSDL } from "@/app/actions/caiDat";
import FormHanhDong from "@/app/components/FormHanhDong";
import { ngayGio } from "@/lib/dinhDang";

export const metadata: Metadata = { title: "Sao lưu dữ liệu" };

const kichThuoc = (b: bigint) => `${(Number(b) / 1024 / 1024).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} MB`;

export default async function TrangSaoLuu() {
  await yeuCauDangNhap("ADMIN");
  const ds = await caiDatService.danhSachSaoLuu();
  return (
    <div className="max-w-4xl space-y-4">
      <section className="rounded-lg border bg-white p-4 text-sm">
        <p className="mb-3 text-gray-700">
          Tạo bản sao lưu toàn bộ cơ sở dữ liệu (file <code>.bak</code> của SQL Server) trong thư mục <code>{THU_MUC_SAO_LUU}</code> của
          máy chủ CSDL (volume Docker <code>mssql_data</code>). Nên sao lưu cuối mỗi ngày và chép file ra nơi khác.
        </p>
        <FormHanhDong action={saoLuuCSDL} xacNhan="Tạo bản sao lưu cơ sở dữ liệu ngay bây giờ?">
          <button className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60">Sao lưu ngay</button>
        </FormHanhDong>
      </section>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[640px] text-sm [&_td]:px-3 [&_td]:py-2 [&_th]:px-3">
          <thead className="border-b bg-gray-50 text-left text-gray-600"><tr><th className="py-2">Thời gian</th><th>Người thực hiện</th><th>File</th><th className="text-right">Kích thước</th></tr></thead>
          <tbody>
            {ds.map((b) => (
              <tr key={b.maBackup} className="border-b last:border-0">
                <td className="whitespace-nowrap">{ngayGio(b.thoiGian)}</td><td>{b.taiKhoan.hoTen}</td>
                <td className="font-mono text-xs break-all">{b.duongDanFile}</td><td className="text-right whitespace-nowrap">{kichThuoc(b.kichThuoc)}</td>
              </tr>
            ))}
            {ds.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-gray-500">Chưa có bản sao lưu</td></tr>}
          </tbody>
        </table>
      </div>
      <details className="rounded-lg border bg-white p-3 text-sm">
        <summary className="cursor-pointer font-medium">Cách phục hồi từ bản sao lưu (làm thủ công, cần dừng ứng dụng)</summary>
        <pre className="mt-2 overflow-x-auto rounded bg-gray-900 p-3 text-xs text-gray-100">{`docker exec -it qlbs-mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -C -Q \\
  "ALTER DATABASE QuanLyBanSach SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
   RESTORE DATABASE QuanLyBanSach FROM DISK = N'<đường dẫn file .bak>' WITH REPLACE;
   ALTER DATABASE QuanLyBanSach SET MULTI_USER;"`}</pre>
      </details>
    </div>
  );
}
