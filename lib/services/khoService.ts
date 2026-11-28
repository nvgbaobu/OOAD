// Nghiệp vụ kho: phiếu nhập, phiếu kiểm kê, phiếu xuất hủy.
// - Phiếu nhập: NCC phải đang giao dịch; sách đang bán; SL > 0; 0 < giá nhập ≤ giá bán hiện tại.
//   Duyệt → cộng tồn kho + cập nhật Sach.giaNhap = giá nhập mới nhất (giữ ràng buộc giá bán ≥ giá nhập).
// Vòng đời phiếu: Staff/Admin lập (CHO_DUYET) → Admin duyệt (DA_DUYET, cộng/trừ kho) hoặc từ chối (TU_CHOI, kho không đổi).
// - Kiểm kê: slHeThong = tồn kho lúc lập phiếu. Khi duyệt cộng CHÊNH LỆCH (slThucTe − slHeThong) vào tồn hiện tại
//   (không ghi đè bằng slThucTe vì giữa lúc lập và lúc duyệt có thể đã bán thêm). Một cuốn sách không được nằm
//   trong 2 phiếu kiểm kê chờ duyệt cùng lúc (tránh trừ chênh lệch 2 lần).
// - Xuất hủy: khi lập kiểm tra số lượng ≤ số bán được; khi duyệt trừ kho bằng UPDATE có điều kiện
//   (không trừ phần đang tạm giữ trong đơn chưa thanh toán).
// - Duyệt / từ chối chỉ khi phiếu còn CHO_DUYET (UPDATE có điều kiện → không duyệt 2 lần). Lỗi giữa chừng → rollback.
import { prisma } from "@/lib/prisma";
import { LoiNghiepVu } from "@/lib/loi";
import { phieuKhoRepository } from "@/lib/repositories/phieuKhoRepository";
import { sachRepository } from "@/lib/repositories/sachRepository";
import { nhaCungCapRepository } from "@/lib/repositories/nhaCungCapRepository";
import { Sach } from "@/lib/entities/Sach";
import { NhaCungCap } from "@/lib/entities/NhaCungCap";
import { PhieuNhap } from "@/lib/entities/PhieuNhap";
import { PhieuKiemKe } from "@/lib/entities/PhieuKiemKe";
import { PhieuXuatHuy } from "@/lib/entities/PhieuXuatHuy";
import { ChiTietKiemKe } from "@/lib/entities/ChiTietPhieuKho";
import { NhatKyHeThong } from "@/lib/entities/NhatKyHeThong";

export const TRANG_THAI_PHIEU = { CHO_DUYET: "Chờ duyệt", DA_DUYET: "Đã duyệt", TU_CHOI: "Từ chối" } as const;
export type TrangThaiPhieu = keyof typeof TRANG_THAI_PHIEU;

/** Dòng thô từ form (chuỗi). Kiểm kê dùng slThucTe, xuất hủy dùng soLuong. */
export type DongPhieuTho = { maSach: string; slThucTe?: string; soLuong?: string; lyDo?: string; giaNhap?: string };

const chuanHoa = (s: string | undefined) => (s ?? "").trim().replace(/\s+/g, " ");
const soNguyen = (s: string | undefined) => ((s ?? "").trim() === "" ? NaN : Number(s));
const soTien = (s: string | undefined) => ((s ?? "").trim() === "" ? NaN : Number((s ?? "").replace(/[.,\s]/g, "")));
const vnd = (n: number) => `${n.toLocaleString("vi-VN")}đ`;

/** Kiểm tra chung: có dòng, sách tồn tại, không trùng, ghi chú ≤ 500. Trả về map sách + lỗi đã gom. */
async function kiemTraChung(ghiChuTho: string, dong: DongPhieuTho[]) {
  const loi: Record<string, string> = {};
  const ghiChu = chuanHoa(ghiChuTho) || null;
  if (ghiChu && ghiChu.length > 500) loi.ghiChu = "Ghi chú tối đa 500 ký tự";
  if (dong.length === 0) throw new LoiNghiepVu("Phiếu phải có ít nhất 1 cuốn sách");

  const maSachs = dong.map((d) => Number(d.maSach));
  if (maSachs.some((m) => !Number.isInteger(m))) throw new LoiNghiepVu("Dòng sách không hợp lệ");
  if (new Set(maSachs).size !== maSachs.length) throw new LoiNghiepVu("Một cuốn sách chỉ được có 1 dòng trong phiếu");
  const sachs = new Map((await sachRepository.timNhieu(maSachs)).map((s) => [s.maSach, s]));
  if (sachs.size !== maSachs.length) throw new LoiNghiepVu("Có sách không tồn tại");
  return { loi, ghiChu, sachs };
}

function kiemTraLyDoTuChoi(lyDoTho: string) {
  const lyDo = chuanHoa(lyDoTho);
  if (!lyDo) throw new LoiNghiepVu("Nhập lý do từ chối", { lyDoTuChoi: "Nhập lý do từ chối" });
  if (lyDo.length > 500) throw new LoiNghiepVu("Lý do tối đa 500 ký tự", { lyDoTuChoi: "Tối đa 500 ký tự" });
  return lyDo;
}

export const khoService = {
  async tongQuan() {
    const [thongKe, sapHet, choDuyet] = await Promise.all([
      sachRepository.thongKeTon(),
      sachRepository.sapHetHang(),
      phieuKhoRepository.demChoDuyet(),
    ]);
    return { thongKe, sapHet, choDuyet };
  },

  /** Sách để chọn khi lập phiếu (Decimal → number để truyền sang client component). */
  sachDeChon: async () =>
    (await sachRepository.tatCaDeChon()).map((s) => ({ ...s, giaNhap: Number(s.giaNhap), giaBan: Number(s.giaBan) })),

  nhaCungCapDeChon: () => nhaCungCapRepository.dangGiaoDich(),

  // ───────── Phiếu nhập ─────────

  danhSachPhieuNhap: (trangThai?: TrangThaiPhieu) => phieuKhoRepository.danhSachPhieuNhap(trangThai),
  layPhieuNhap: (maPN: number) => phieuKhoRepository.layPhieuNhap(prisma, maPN),

  async lapPhieuNhap(maNCCTho: string, ghiChuTho: string, dongTho: DongPhieuTho[], maTK: number) {
    const maNCC = Number(maNCCTho);
    const ncc = Number.isInteger(maNCC) && maNCC > 0 ? await NhaCungCap.timTheoMa(maNCC) : null;
    const loiNCC = !ncc ? "Chọn nhà cung cấp" : !ncc.dangGiaoDich() ? `"${ncc.tenNCC}" đã ngừng giao dịch` : null;
    const { loi, ghiChu, sachs } = await kiemTraChung(ghiChuTho, dongTho);
    if (loiNCC) loi.maNCC = loiNCC;
    const dong = dongTho.map((d) => {
      const s = sachs.get(Number(d.maSach))!;
      const soLuong = soNguyen(d.soLuong);
      const giaNhap = soTien(d.giaNhap);
      const k = `dong.${s.maSach}`;
      if (s.trangThai !== "DANG_BAN") loi[k] = "Sách đã ngừng kinh doanh – mở bán lại trước khi nhập";
      else if (!Number.isInteger(soLuong) || soLuong <= 0 || soLuong > 100000) loi[k] = "Số lượng nhập là số nguyên > 0";
      else if (!Number.isFinite(giaNhap) || giaNhap <= 0) loi[k] = "Giá nhập là số > 0";
      else if (giaNhap > Number(s.giaBan)) loi[k] = `Giá nhập cao hơn giá bán hiện tại (${vnd(Number(s.giaBan))}) – sửa giá bán ở màn hình Sách trước`;
      return { maSach: s.maSach, soLuong, giaNhap };
    });
    if (Object.keys(loi).length) throw new LoiNghiepVu(loi.maNCC && Object.keys(loi).length === 1 ? loi.maNCC : "Phiếu chưa hợp lệ, kiểm tra các ô báo đỏ", loi);

    const phieu = PhieuNhap.moi(maTK, ghiChu);
    phieu.ganNhaCungCap(ncc!);
    for (const d of dong) phieu.themChiTiet(d, d.soLuong, d.giaNhap);
    const tongTien = phieu.tinhTongTien();
    phieu.guiDuyet();
    await phieu.luu();
    await NhatKyHeThong.ghiNhatKy({
      maTK, module: "KHO", hanhDong: "LAP_PHIEU_NHAP",
      noiDung: `Phiếu #${phieu.maPN} – ${ncc!.tenNCC}: ${dong.length} sách, ${dong.reduce((t, d) => t + d.soLuong, 0)} cuốn, ${vnd(tongTien)}`,
    });
    return phieu;
  },

  async duyetPhieuNhap(maPN: number, maTK: number) {
    await prisma.$transaction(async (tx) => {
      const phieu = await phieuKhoRepository.layPhieuNhap(tx, maPN);
      if (!phieu) throw new LoiNghiepVu("Phiếu không tồn tại");
      if (!(await new PhieuNhap(phieu).duyet(maTK, tx))) throw new LoiNghiepVu("Phiếu đã được xử lý trước đó");
      const doiGia: string[] = [];
      for (const c of phieu.chiTiets) {
        const giaMoi = Number(c.giaNhap);
        if (!(await new Sach(c.sach).capNhatGiaNhap(giaMoi, tx))) {
          throw new LoiNghiepVu(`Giá nhập "${c.sach.tenSach}" (${vnd(giaMoi)}) cao hơn giá bán hiện tại (${vnd(Number(c.sach.giaBan))}) – sửa giá bán trước khi duyệt`);
        }
        if (Number(c.sach.giaNhap) !== giaMoi) doiGia.push(`${c.sach.tenSach}: ${Number(c.sach.giaNhap)} → ${giaMoi}`);
        await new Sach(c.sach).congTon(c.soLuong, tx);
      }
      await NhatKyHeThong.ghiNhatKy(
        {
          maTK, module: "KHO", hanhDong: "DUYET_PHIEU_NHAP",
          noiDung: `Phiếu #${maPN}: ${phieu.chiTiets.map((c) => `${c.sach.tenSach} +${c.soLuong}`).join(", ")}${doiGia.length ? `. Giá nhập: ${doiGia.join(", ")}` : ""}`,
        },
        tx,
      );
    });
  },

  /** UC7.3 – 2a. Hàng giao thiếu/lỗi: Admin sửa số lượng thực nhận của 1 dòng trước khi duyệt (chỉ giảm, 1 ≤ SL mới ≤ SL trên phiếu). */
  async suaSoLuongThucNhan(maPN: number, maSachTho: string, soLuongTho: string, maTK: number) {
    const maSach = Number(maSachTho);
    const soLuong = soNguyen(soLuongTho);
    await prisma.$transaction(async (tx) => {
      const phieu = await phieuKhoRepository.layPhieuNhap(tx, maPN);
      if (!phieu) throw new LoiNghiepVu("Phiếu không tồn tại");
      if (phieu.trangThai !== "CHO_DUYET") throw new LoiNghiepVu("Chỉ sửa được phiếu đang chờ duyệt");
      const dong = phieu.chiTiets.find((c) => c.maSach === maSach);
      if (!dong) throw new LoiNghiepVu("Sách không có trong phiếu");
      if (!Number.isInteger(soLuong) || soLuong < 1 || soLuong > dong.soLuong) {
        throw new LoiNghiepVu(`Số lượng thực nhận là số nguyên từ 1 đến ${dong.soLuong}`, { soLuong: `Từ 1 đến ${dong.soLuong}` });
      }
      if (soLuong === dong.soLuong) return;
      const pn = new PhieuNhap(phieu);
      if (!(await pn.capNhatSoLuong(maSach, soLuong, tx))) throw new LoiNghiepVu("Phiếu đã được xử lý trước đó");
      const tongTien = Number(pn.tongTien);
      await NhatKyHeThong.ghiNhatKy(
        { maTK, module: "KHO", hanhDong: "SUA_SL_PHIEU_NHAP", noiDung: `Phiếu #${maPN} – ${dong.sach.tenSach}: ${dong.soLuong} → ${soLuong} cuốn, tổng tiền ${vnd(tongTien)}` },
        tx,
      );
    });
  },

  async tuChoiPhieuNhap(maPN: number, lyDoTho: string, maTK: number) {
    const lyDo = kiemTraLyDoTuChoi(lyDoTho);
    if (!(await PhieuNhap.thamChieu(maPN).tuChoi(maTK, lyDo))) {
      throw new LoiNghiepVu("Phiếu không tồn tại hoặc đã được xử lý");
    }
    await NhatKyHeThong.ghiNhatKy({ maTK, module: "KHO", hanhDong: "TU_CHOI_PHIEU_NHAP", noiDung: `Phiếu #${maPN}: ${lyDo}` });
  },

  // ───────── Kiểm kê ─────────

  danhSachKiemKe: (trangThai?: TrangThaiPhieu) => phieuKhoRepository.danhSachKiemKe(trangThai),
  layKiemKe: (maPKK: number) => phieuKhoRepository.layKiemKe(prisma, maPKK),

  async lapKiemKe(ghiChuTho: string, dongTho: DongPhieuTho[], maTK: number) {
    const { loi, ghiChu, sachs } = await kiemTraChung(ghiChuTho, dongTho);
    const dong = dongTho.map((d) => {
      const s = sachs.get(Number(d.maSach))!;
      const slThucTe = soNguyen(d.slThucTe);
      const lyDoChenhLech = chuanHoa(d.lyDo) || null;
      const k = `dong.${s.maSach}`;
      if (!Number.isInteger(slThucTe) || slThucTe < 0) loi[k] = "Số lượng thực tế là số nguyên ≥ 0";
      else if (slThucTe !== s.soLuongTon && !lyDoChenhLech) loi[k] = "Có chênh lệch – nhập lý do";
      else if (lyDoChenhLech && lyDoChenhLech.length > 500) loi[k] = "Lý do tối đa 500 ký tự";
      return { sach: s, maSach: s.maSach, slHeThong: s.soLuongTon, slThucTe, lyDoChenhLech };
    });
    for (const c of await phieuKhoRepository.sachDangChoKiemKe(dong.map((d) => d.maSach))) {
      loi[`dong.${c.maSach}`] ??= `Đang nằm trong phiếu kiểm kê #${c.maPKK} chờ duyệt`;
    }
    if (Object.keys(loi).length) throw new LoiNghiepVu("Phiếu chưa hợp lệ, kiểm tra các dòng báo đỏ", loi);

    const phieu = PhieuKiemKe.moi(maTK, ghiChu);
    for (const d of dong) phieu.themChiTiet(d.sach, d.slThucTe, d.lyDoChenhLech); // slHeThong = tồn kho lúc lập
    phieu.guiDuyet();
    await phieu.luu();
    const soLech = dong.filter((d) => d.slThucTe !== d.slHeThong).length;
    await NhatKyHeThong.ghiNhatKy({ maTK, module: "KHO", hanhDong: "LAP_KIEM_KE", noiDung: `Phiếu #${phieu.maPKK}: ${dong.length} sách, ${soLech} sách lệch` });
    return phieu;
  },

  async duyetKiemKe(maPKK: number, maTK: number) {
    await prisma.$transaction(async (tx) => {
      const phieu = await phieuKhoRepository.layKiemKe(tx, maPKK);
      if (!phieu) throw new LoiNghiepVu("Phiếu không tồn tại");
      if (!(await new PhieuKiemKe(phieu).duyet(maTK, tx))) throw new LoiNghiepVu("Phiếu đã được xử lý trước đó");
      const thayDoi: string[] = [];
      for (const c of phieu.chiTiets) {
        const chenh = new ChiTietKiemKe(c).chenhLech();
        if (chenh === 0) continue;
        const sach = new Sach(c.sach);
        // Cộng chênh lệch vào tồn HIỆN TẠI (không ghi đè bằng slThucTe)
        if (!(await (chenh > 0 ? sach.congTon(chenh, tx) : sach.truTon(-chenh, tx)))) {
          throw new LoiNghiepVu(`Không trừ được ${-chenh} cuốn "${c.sach.tenSach}": tồn kho hiện tại không đủ (một phần đang nằm trong đơn chưa thanh toán)`);
        }
        thayDoi.push(`${c.sach.tenSach} ${chenh > 0 ? "+" : ""}${chenh}`);
      }
      await NhatKyHeThong.ghiNhatKy(
        { maTK, module: "KHO", hanhDong: "DUYET_KIEM_KE", noiDung: `Phiếu #${maPKK}${thayDoi.length ? `: ${thayDoi.join(", ")}` : ": không chênh lệch"}` },
        tx,
      );
    });
  },

  async tuChoiKiemKe(maPKK: number, lyDoTho: string, maTK: number) {
    const lyDo = kiemTraLyDoTuChoi(lyDoTho);
    if (!(await PhieuKiemKe.thamChieu(maPKK).tuChoi(maTK, lyDo))) {
      throw new LoiNghiepVu("Phiếu không tồn tại hoặc đã được xử lý");
    }
    await NhatKyHeThong.ghiNhatKy({ maTK, module: "KHO", hanhDong: "TU_CHOI_KIEM_KE", noiDung: `Phiếu #${maPKK}: ${lyDo}` });
  },

  // ───────── Xuất hủy ─────────

  danhSachXuatHuy: (trangThai?: TrangThaiPhieu) => phieuKhoRepository.danhSachXuatHuy(trangThai),
  layXuatHuy: (maPXH: number) => phieuKhoRepository.layXuatHuy(prisma, maPXH),

  async lapXuatHuy(ghiChuTho: string, dongTho: DongPhieuTho[], maTK: number) {
    const { loi, ghiChu, sachs } = await kiemTraChung(ghiChuTho, dongTho);
    const dong = dongTho.map((d) => {
      const s = sachs.get(Number(d.maSach))!;
      const soLuong = soNguyen(d.soLuong);
      const lyDo = chuanHoa(d.lyDo);
      const conBan = s.soLuongTon - s.soLuongTamGiu;
      const k = `dong.${s.maSach}`;
      if (!Number.isInteger(soLuong) || soLuong <= 0) loi[k] = "Số lượng hủy là số nguyên > 0";
      else if (soLuong > conBan) loi[k] = `Số lượng hủy vượt quá tồn kho: chỉ còn ${conBan} cuốn có thể xuất hủy${s.soLuongTamGiu ? ` (${s.soLuongTamGiu} đang tạm giữ)` : ""}`;
      else if (!lyDo) loi[k] = "Nhập lý do hủy";
      else if (lyDo.length > 500) loi[k] = "Lý do tối đa 500 ký tự";
      return { maSach: s.maSach, soLuong, lyDo };
    });
    if (Object.keys(loi).length) throw new LoiNghiepVu("Phiếu chưa hợp lệ, kiểm tra các dòng báo đỏ", loi);

    const phieu = PhieuXuatHuy.moi(maTK, ghiChu);
    for (const d of dong) phieu.themChiTiet(d, d.soLuong, d.lyDo);
    phieu.guiDuyet();
    await phieu.luu();
    const tong = dong.reduce((t, d) => t + d.soLuong, 0);
    await NhatKyHeThong.ghiNhatKy({ maTK, module: "KHO", hanhDong: "LAP_XUAT_HUY", noiDung: `Phiếu #${phieu.maPXH}: ${dong.length} sách, ${tong} cuốn` });
    return phieu;
  },

  async duyetXuatHuy(maPXH: number, maTK: number) {
    await prisma.$transaction(async (tx) => {
      const phieu = await phieuKhoRepository.layXuatHuy(tx, maPXH);
      if (!phieu) throw new LoiNghiepVu("Phiếu không tồn tại");
      if (!(await new PhieuXuatHuy(phieu).duyet(maTK, tx))) throw new LoiNghiepVu("Phiếu đã được xử lý trước đó");
      for (const c of phieu.chiTiets) {
        if (!(await new Sach(c.sach).truTon(c.soLuong, tx))) {
          throw new LoiNghiepVu(`Không đủ "${c.sach.tenSach}" để hủy ${c.soLuong} cuốn (tồn kho đã giảm hoặc đang tạm giữ trong đơn chưa thanh toán)`);
        }
      }
      await NhatKyHeThong.ghiNhatKy(
        { maTK, module: "KHO", hanhDong: "DUYET_XUAT_HUY", noiDung: `Phiếu #${maPXH}: ${phieu.chiTiets.map((c) => `${c.sach.tenSach} −${c.soLuong}`).join(", ")}` },
        tx,
      );
    });
  },

  async tuChoiXuatHuy(maPXH: number, lyDoTho: string, maTK: number) {
    const lyDo = kiemTraLyDoTuChoi(lyDoTho);
    if (!(await PhieuXuatHuy.thamChieu(maPXH).tuChoi(maTK, lyDo))) {
      throw new LoiNghiepVu("Phiếu không tồn tại hoặc đã được xử lý");
    }
    await NhatKyHeThong.ghiNhatKy({ maTK, module: "KHO", hanhDong: "TU_CHOI_XUAT_HUY", noiDung: `Phiếu #${maPXH}: ${lyDo}` });
  },
};
