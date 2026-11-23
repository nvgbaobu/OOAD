import type { Metadata } from "next";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { caiDatService, THU_MUC_SAO_LUU } from "@/lib/services/caiDatService";
import { saoLuuCSDL, phucHoiTuBanSaoLuu, phucHoiTuFile } from "@/app/actions/caiDat";
import { choPhepTaiLen } from "@/lib/services/phucHoiService";
import FormPhucHoi from "./FormPhucHoi";
import FormHanhDong from "@/app/components/FormHanhDong";
import { ngayGio } from "@/lib/dinhDang";

export const metadata: Metadata = { title: "Sao lưu dữ liệu" };

const kichThuoc = (b: bigint) => `${(Number(b) / 1024 / 1024).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} MB`;

export default async function TrangSaoLuu() {
  await yeuCauDangNhap("ADMIN");
  const ds = await caiDatService.danhSachSaoLuu();
  const taiLen = choPhepTaiLen();
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
          <thead className="border-b bg-gray-50 text-left text-gray-600"><tr><th className="py-2">Thời gian</th><th>Người thực hiện</th><th>File</th><th className="text-right">Kích thước</th><th /></tr></thead>
          <tbody>
            {ds.map((b) => (
              <tr key={b.maBackup} className="border-b last:border-0">
                <td className="whitespace-nowrap">{ngayGio(b.thoiGian)}</td><td>{b.taiKhoan.hoTen}</td>
                <td className="font-mono text-xs break-all">{b.duongDanFile}</td><td className="text-right whitespace-nowrap">{kichThuoc(b.kichThuoc)}</td>
                <td className="text-right">
                  <FormPhucHoi action={phucHoiTuBanSaoLuu} className="flex flex-col items-end"
                    xacNhan={`Phục hồi CSDL về bản sao lưu lúc ${ngayGio(b.thoiGian)}?\nToàn bộ dữ liệu hiện tại sẽ bị GHI ĐÈ (hệ thống tự sao lưu trạng thái hiện tại trước khi phục hồi). Mọi người dùng đang thao tác sẽ bị ngắt.`}>
                    <input type="hidden" name="maBackup" value={b.maBackup} />
                    <button className="rounded border border-orange-500 px-2 py-0.5 text-xs text-orange-700 hover:bg-orange-50">Phục hồi</button>
                  </FormPhucHoi>
                </td>
              </tr>
            ))}
            {ds.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-gray-500">Chưa có bản sao lưu</td></tr>}
          </tbody>
        </table>
      </div>
      <section className="rounded-lg border bg-white p-4 text-sm">
        <h2 className="mb-2 font-semibold">Phục hồi từ file sao lưu tải lên</h2>
        {taiLen ? (
          <FormPhucHoi action={phucHoiTuFile} className="flex flex-wrap items-center gap-2"
            xacNhan={"Phục hồi CSDL từ file đã chọn?\nToàn bộ dữ liệu hiện tại sẽ bị GHI ĐÈ (hệ thống tự sao lưu trạng thái hiện tại trước khi phục hồi). Mọi người dùng đang thao tác sẽ bị ngắt."}>
            <input type="file" name="file" accept=".bak" required className="text-sm" />
            <button className="rounded bg-orange-600 px-3 py-1.5 text-white hover:bg-orange-700">Tải lên và phục hồi</button>
          </FormPhucHoi>
        ) : (
          <p className="text-gray-600">
            Chức năng tải file lên chỉ bật khi chạy bằng Docker Compose (thư mục dùng chung giữa ứng dụng và SQL Server).
            Hiện tại hãy phục hồi từ các bản sao lưu trong danh sách ở trên.
          </p>
        )}
        <p className="mt-2 text-xs text-gray-500">
          Hệ thống kiểm tra file hợp lệ và đúng CSDL <code>QuanLyBanSach</code>, tự tạo một bản sao lưu của dữ liệu hiện tại rồi mới ghi đè.
          File lỗi/không hợp lệ thì dữ liệu được giữ nguyên.
        </p>
      </section>
    </div>
  );
}
