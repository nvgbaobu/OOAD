// Nghiệp vụ Cài đặt (chỉ Admin): cấu hình cửa hàng & tích điểm & phương thức thanh toán, xem nhật ký, sao lưu CSDL.
// - CauHinhHeThong chỉ có 1 dòng (maCH = 1). Đổi cấu hình áp dụng ngay cho đơn chưa thanh toán; hóa đơn cũ giữ số đã lưu.
// - Tích điểm: tyLeQuyDoiDiem (số tiền / 1 điểm) 1.000–1.000.000đ; giaTriMotDiem (1 điểm = ? đồng) phải NHỎ HƠN
//   tyLeQuyDoiDiem (nếu không khách được hoàn ≥ 100% tiền bằng điểm). Phải bật ít nhất 1 phương thức thanh toán.
// - Sao lưu: BACKUP DATABASE ra file .bak trong thư mục dữ liệu của SQL Server (volume Docker mssql_data), ghi BanSaoLuu.
//   Phục hồi làm thủ công bằng sqlcmd (xem README, mục "Sao lưu & phục hồi CSDL") – không làm trên giao diện vì phải ngắt mọi kết nối.
import { prisma } from "@/lib/prisma";
import { LoiNghiepVu } from "@/lib/loi";
import { cauHinhRepository } from "@/lib/repositories/cauHinhRepository";
import { nhatKyRepository } from "@/lib/repositories/nhatKyRepository";
import type { Prisma } from "@/lib/generated/prisma/client";

export type FormCauHinh = Record<"tenCuaHang" | "diaChi" | "soDienThoai" | "maSoThue" | "logo" | "tyLeQuyDoiDiem" | "giaTriMotDiem", string>
  & { ttTienMat: boolean; ttQuetThe: boolean; ttMaQR: boolean };

export type LocNhatKy = { module?: string; maTK?: number; tuKhoa?: string; tuNgay?: Date; denNgay?: Date };
export const SO_NHAT_KY_MOI_TRANG = 50;
/** Thư mục chứa file sao lưu bên trong container SQL Server (nằm trên volume mssql_data nên không mất khi tạo lại container). */
export const THU_MUC_SAO_LUU = "/var/opt/mssql/data";

const chuanHoa = (s: string) => s.trim().replace(/\s+/g, " ");
const soNguyen = (s: string) => (s.trim() === "" ? NaN : Number(s.replace(/[.,\s]/g, "")));

function dieuKienNhatKy(loc: LocNhatKy): Prisma.NhatKyHeThongWhereInput {
  return {
    ...(loc.module && { module: loc.module }),
    ...(loc.maTK && { maTK: loc.maTK }),
    ...(loc.tuKhoa && { OR: [{ noiDung: { contains: loc.tuKhoa } }, { hanhDong: { contains: loc.tuKhoa } }] }),
    ...((loc.tuNgay || loc.denNgay) && { thoiGian: { ...(loc.tuNgay && { gte: loc.tuNgay }), ...(loc.denNgay && { lt: loc.denNgay }) } }),
  };
}

export const caiDatService = {
  layCauHinh: () => cauHinhRepository.lay(),

  async luuCauHinh(f: FormCauHinh, maTK: number) {
    const loi: Record<string, string> = {};
    const tenCuaHang = chuanHoa(f.tenCuaHang);
    const diaChi = chuanHoa(f.diaChi) || null;
    const soDienThoai = f.soDienThoai.replace(/[\s.-]/g, "") || null;
    const maSoThue = f.maSoThue.replace(/\s/g, "") || null;
    const logo = f.logo.trim() || null;
    const tyLeQuyDoiDiem = soNguyen(f.tyLeQuyDoiDiem);
    const giaTriMotDiem = soNguyen(f.giaTriMotDiem);

    if (!tenCuaHang) loi.tenCuaHang = "Nhập tên cửa hàng";
    else if (tenCuaHang.length > 150) loi.tenCuaHang = "Tối đa 150 ký tự";
    if (diaChi && diaChi.length > 255) loi.diaChi = "Tối đa 255 ký tự";
    if (soDienThoai && !/^0\d{9,10}$/.test(soDienThoai)) loi.soDienThoai = "10–11 số, bắt đầu bằng 0";
    if (maSoThue && !/^\d{10}(-\d{3})?$/.test(maSoThue)) loi.maSoThue = "10 số (chi nhánh: 10 số-3 số)";
    if (logo && (logo.length > 500 || !/^(https?:\/\/|\/)\S+$/.test(logo))) loi.logo = "Đường dẫn bắt đầu bằng http(s):// hoặc /";
    if (!Number.isInteger(tyLeQuyDoiDiem) || tyLeQuyDoiDiem < 1000 || tyLeQuyDoiDiem > 1_000_000) loi.tyLeQuyDoiDiem = "Số nguyên từ 1.000 đến 1.000.000 đồng";
    if (!Number.isInteger(giaTriMotDiem) || giaTriMotDiem < 1) loi.giaTriMotDiem = "Số nguyên ≥ 1 đồng";
    else if (!loi.tyLeQuyDoiDiem && giaTriMotDiem >= tyLeQuyDoiDiem) loi.giaTriMotDiem = "Phải nhỏ hơn số tiền để được 1 điểm";
    if (!f.ttTienMat && !f.ttQuetThe && !f.ttMaQR) loi.phuongThuc = "Bật ít nhất 1 phương thức thanh toán";
    if (Object.keys(loi).length) throw new LoiNghiepVu("Dữ liệu chưa hợp lệ, kiểm tra các ô báo đỏ", loi);

    const cu = await cauHinhRepository.lay();
    const moi = { tenCuaHang, diaChi, soDienThoai, maSoThue, logo, tyLeQuyDoiDiem, giaTriMotDiem, ttTienMat: f.ttTienMat, ttQuetThe: f.ttQuetThe, ttMaQR: f.ttMaQR };
    await prisma.cauHinhHeThong.update({ where: { maCH: 1 }, data: moi });
    const doi = (Object.keys(moi) as (keyof typeof moi)[])
      .filter((k) => String(cu[k] === null ? "" : typeof cu[k] === "object" ? Number(cu[k]) : cu[k]) !== String(moi[k] ?? ""))
      .map((k) => `${k}: ${cu[k] === null ? "–" : typeof cu[k] === "object" ? Number(cu[k]) : cu[k]} → ${moi[k] ?? "–"}`);
    await nhatKyRepository.ghi({ maTK, module: "CAI_DAT", hanhDong: "SUA", noiDung: doi.join("; ") || "Không thay đổi" });
  },

  // ───────── Nhật ký ─────────
  async nhatKy(loc: LocNhatKy, trang: number) {
    const where = dieuKienNhatKy(loc);
    const tong = await prisma.nhatKyHeThong.count({ where });
    const soTrang = Math.max(1, Math.ceil(tong / SO_NHAT_KY_MOI_TRANG));
    const trangHienTai = Math.min(Math.max(1, trang), soTrang);
    const dong = await prisma.nhatKyHeThong.findMany({
      where, include: { taiKhoan: { select: { hoTen: true } } },
      orderBy: { maLog: "desc" }, skip: (trangHienTai - 1) * SO_NHAT_KY_MOI_TRANG, take: SO_NHAT_KY_MOI_TRANG,
    });
    return { dong, tong, soTrang, trang: trangHienTai };
  },
  cacModuleNhatKy: async () => (await prisma.nhatKyHeThong.findMany({ distinct: ["module"], select: { module: true }, orderBy: { module: "asc" } })).map((x) => x.module),

  // ───────── Sao lưu ─────────
  danhSachSaoLuu: () => prisma.banSaoLuu.findMany({ include: { taiKhoan: { select: { hoTen: true } } }, orderBy: { maBackup: "desc" }, take: 50 }),

  async saoLuu(maTK: number) {
    const db = process.env.DB_NAME ?? "QuanLyBanSach";
    if (!/^\w+$/.test(db)) throw new Error("DB_NAME không hợp lệ");
    const luc = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    const tenFile = `${db}_${luc.getFullYear()}${p(luc.getMonth() + 1)}${p(luc.getDate())}_${p(luc.getHours())}${p(luc.getMinutes())}${p(luc.getSeconds())}.bak`;
    const duongDan = `${THU_MUC_SAO_LUU}/${tenFile}`;
    // Tên CSDL/đường dẫn tự sinh (chỉ chữ, số, _), không lấy từ người dùng → ghép chuỗi an toàn. BACKUP không chạy được trong transaction.
    try {
      await prisma.$executeRawUnsafe(`BACKUP DATABASE [${db}] TO DISK = N'${duongDan}' WITH INIT, COPY_ONLY, NAME = N'${tenFile}'`);
    } catch (e) {
      throw new LoiNghiepVu(`Sao lưu thất bại: ${e instanceof Error ? e.message.slice(0, 200) : e}`);
    }
    const [kq] = await prisma.$queryRaw<{ kichThuoc: bigint | number }[]>`
      SELECT TOP 1 CAST(backup_size AS BIGINT) AS kichThuoc FROM msdb.dbo.backupset
      WHERE database_name = ${db} AND name = ${tenFile} ORDER BY backup_finish_date DESC`;
    const bs = await prisma.banSaoLuu.create({ data: { maTK, thoiGian: luc, duongDanFile: duongDan, kichThuoc: BigInt(kq?.kichThuoc ?? 0) } });
    await nhatKyRepository.ghi({ maTK, module: "CAI_DAT", hanhDong: "SAO_LUU", noiDung: `${duongDan} (${Number(bs.kichThuoc).toLocaleString("vi-VN")} byte)` });
    return bs;
  },
};
