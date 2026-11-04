// Nghiệp vụ nhà cung cấp (chỉ Admin).
// Không xóa NCC đã có phiếu nhập (giữ lịch sử) – chuyển "Ngừng giao dịch": không chọn được khi lập phiếu nhập mới.
// NCC chưa từng có phiếu nhập thì xóa được (nhập nhầm).
import { prisma } from "@/lib/prisma";
import { LoiNghiepVu } from "@/lib/loi";
import { nhaCungCapRepository, type LocNhaCungCap } from "@/lib/repositories/nhaCungCapRepository";
import { nhatKyRepository } from "@/lib/repositories/nhatKyRepository";

export const TRANG_THAI_NCC = { DANG_GIAO_DICH: "Đang giao dịch", NGUNG_GIAO_DICH: "Ngừng giao dịch" } as const;
export type TrangThaiNCC = keyof typeof TRANG_THAI_NCC;

export type FormNhaCungCap = Record<"tenNCC" | "maSoThue" | "diaChi" | "nguoiLienHe" | "soDienThoai", string>;

const chuanHoa = (s: string | undefined) => (s ?? "").trim().replace(/\s+/g, " ");

async function kiemTra(f: FormNhaCungCap, maNCCDangSua?: number) {
  const loi: Record<string, string> = {};
  const tenNCC = chuanHoa(f.tenNCC);
  const maSoThue = (f.maSoThue ?? "").replace(/\s/g, "");
  const diaChi = chuanHoa(f.diaChi) || null;
  const nguoiLienHe = chuanHoa(f.nguoiLienHe) || null;
  const soDienThoai = (f.soDienThoai ?? "").replace(/[\s.-]/g, "") || null;

  if (!tenNCC) loi.tenNCC = "Nhập tên nhà cung cấp";
  else if (tenNCC.length > 150) loi.tenNCC = "Tối đa 150 ký tự";
  // MST doanh nghiệp: 10 số; chi nhánh: 10 số + "-" + 3 số
  if (!/^\d{10}(-\d{3})?$/.test(maSoThue)) loi.maSoThue = "Mã số thuế gồm 10 số (chi nhánh: 10 số-3 số)";
  else {
    const trung = await nhaCungCapRepository.timTheoMaSoThue(maSoThue);
    if (trung && trung.maNCC !== maNCCDangSua) loi.maSoThue = `Mã số thuế đã có: "${trung.tenNCC}"`;
  }
  if (diaChi && diaChi.length > 255) loi.diaChi = "Tối đa 255 ký tự";
  if (nguoiLienHe && nguoiLienHe.length > 100) loi.nguoiLienHe = "Tối đa 100 ký tự";
  if (soDienThoai && !/^0\d{9,10}$/.test(soDienThoai)) loi.soDienThoai = "Số điện thoại 10–11 số, bắt đầu bằng 0";
  if (Object.keys(loi).length) throw new LoiNghiepVu("Dữ liệu chưa hợp lệ, kiểm tra các ô báo đỏ", loi);
  return { tenNCC, maSoThue, diaChi, nguoiLienHe, soDienThoai };
}

export const nhaCungCapService = {
  danhSach: (loc: LocNhaCungCap) => nhaCungCapRepository.danhSach(loc),
  dangGiaoDich: () => nhaCungCapRepository.dangGiaoDich(),

  async layChiTiet(maNCC: number) {
    const ncc = await nhaCungCapRepository.timTheoMa(maNCC);
    if (!ncc) return null;
    const [thongKe, phieuNhaps] = await Promise.all([
      nhaCungCapRepository.thongKeNhap(maNCC),
      prisma.phieuNhap.findMany({
        where: { maNCC }, orderBy: { maPN: "desc" }, take: 20,
        select: { maPN: true, ngayLap: true, trangThai: true, tongTien: true, nguoiLap: { select: { hoTen: true } } },
      }),
    ]);
    return { ncc, thongKe, phieuNhaps };
  },

  async tao(f: FormNhaCungCap, maTK: number) {
    const d = await kiemTra(f);
    const ncc = await nhaCungCapRepository.tao({ ...d, trangThaiHopTac: "DANG_GIAO_DICH" });
    await nhatKyRepository.ghi({ maTK, module: "NHA_CUNG_CAP", hanhDong: "THEM", noiDung: `#${ncc.maNCC} ${ncc.tenNCC} (MST ${ncc.maSoThue})` });
    return ncc;
  },

  async capNhat(maNCC: number, f: FormNhaCungCap, maTK: number) {
    if (!(await nhaCungCapRepository.timTheoMa(maNCC))) throw new LoiNghiepVu("Nhà cung cấp không tồn tại");
    const d = await kiemTra(f, maNCC);
    await nhaCungCapRepository.capNhat(maNCC, d);
    await nhatKyRepository.ghi({ maTK, module: "NHA_CUNG_CAP", hanhDong: "SUA", noiDung: `#${maNCC} ${d.tenNCC}` });
  },

  async doiTrangThai(maNCC: number, trangThai: TrangThaiNCC, maTK: number) {
    const ncc = await nhaCungCapRepository.timTheoMa(maNCC);
    if (!ncc) throw new LoiNghiepVu("Nhà cung cấp không tồn tại");
    if (ncc.trangThaiHopTac === trangThai) return;
    await nhaCungCapRepository.capNhat(maNCC, { trangThaiHopTac: trangThai });
    await nhatKyRepository.ghi({
      maTK, module: "NHA_CUNG_CAP", hanhDong: trangThai === "DANG_GIAO_DICH" ? "MO_LAI" : "NGUNG_GIAO_DICH", noiDung: `#${maNCC} ${ncc.tenNCC}`,
    });
  },

  async xoa(maNCC: number, maTK: number) {
    const ncc = await nhaCungCapRepository.timTheoMa(maNCC);
    if (!ncc) throw new LoiNghiepVu("Nhà cung cấp không tồn tại");
    const soPhieu = await prisma.phieuNhap.count({ where: { maNCC } });
    if (soPhieu) throw new LoiNghiepVu(`Không xóa được: đã có ${soPhieu} phiếu nhập. Hãy chuyển "Ngừng giao dịch".`);
    await prisma.nhaCungCap.delete({ where: { maNCC } });
    await nhatKyRepository.ghi({ maTK, module: "NHA_CUNG_CAP", hanhDong: "XOA", noiDung: `${ncc.tenNCC} (MST ${ncc.maSoThue})` });
  },
};
