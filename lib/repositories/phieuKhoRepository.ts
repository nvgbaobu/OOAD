// Phiếu nhập (PhieuNhap/ChiTietPhieuNhap), phiếu kiểm kê (PhieuKiemKe/ChiTietKiemKe), phiếu xuất hủy (PhieuXuatHuy/ChiTietXuatHuy).
// Ba loại phiếu có cùng vòng đời CHO_DUYET → DA_DUYET | TU_CHOI nên gom chung 1 repository.
import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/db";

const nguoi = { select: { maTK: true, hoTen: true } };

export const phieuKhoRepository = {
  // ───────── Kiểm kê ─────────
  danhSachKiemKe: (trangThai?: string) =>
    prisma.phieuKiemKe.findMany({
      where: trangThai ? { trangThai } : undefined,
      include: { nguoiLap: nguoi, nguoiDuyet: nguoi, chiTiets: { select: { slHeThong: true, slThucTe: true } } },
      orderBy: { maPKK: "desc" },
      take: 100,
    }),
  layKiemKe: (db: Db, maPKK: number) =>
    db.phieuKiemKe.findUnique({
      where: { maPKK },
      include: {
        nguoiLap: nguoi, nguoiDuyet: nguoi,
        chiTiets: { include: { sach: true }, orderBy: { sach: { tenSach: "asc" } } },
      },
    }),
  taoKiemKe: (db: Db, maTKLap: number, ghiChu: string | null, dong: { maSach: number; slHeThong: number; slThucTe: number; lyDoChenhLech: string | null }[], trangThai = "CHO_DUYET") =>
    db.phieuKiemKe.create({ data: { maTKLap, ghiChu, trangThai, chiTiets: { create: dong } } }),
  /** Sách đang nằm trong phiếu kiểm kê chờ duyệt khác (tránh duyệt 2 lần cùng chênh lệch). */
  sachDangChoKiemKe: (maSachs: number[]) =>
    prisma.chiTietKiemKe.findMany({
      where: { maSach: { in: maSachs }, phieuKiemKe: { trangThai: "CHO_DUYET" } },
      include: { sach: { select: { tenSach: true } } },
    }),
  /** Chuyển trạng thái có điều kiện (chỉ khi còn CHO_DUYET). Trả về true nếu thành công. */
  async xuLyKiemKe(db: Db, maPKK: number, data: { trangThai: string; maTKDuyet: number; lyDoTuChoi?: string }) {
    const r = await db.phieuKiemKe.updateMany({ where: { maPKK, trangThai: "CHO_DUYET" }, data: { ...data, ngayDuyet: new Date() } });
    return r.count === 1;
  },

  // ───────── Xuất hủy ─────────
  danhSachXuatHuy: (trangThai?: string) =>
    prisma.phieuXuatHuy.findMany({
      where: trangThai ? { trangThai } : undefined,
      include: { nguoiLap: nguoi, nguoiDuyet: nguoi, chiTiets: { select: { soLuong: true } } },
      orderBy: { maPXH: "desc" },
      take: 100,
    }),
  layXuatHuy: (db: Db, maPXH: number) =>
    db.phieuXuatHuy.findUnique({
      where: { maPXH },
      include: {
        nguoiLap: nguoi, nguoiDuyet: nguoi,
        chiTiets: { include: { sach: true }, orderBy: { sach: { tenSach: "asc" } } },
      },
    }),
  taoXuatHuy: (db: Db, maTKLap: number, ghiChu: string | null, dong: { maSach: number; soLuong: number; lyDo: string }[], trangThai = "CHO_DUYET") =>
    db.phieuXuatHuy.create({ data: { maTKLap, ghiChu, trangThai, chiTiets: { create: dong } } }),
  /** Sửa SL hủy 1 dòng, chỉ khi phiếu còn CHO_DUYET. Trả về true nếu sửa được. */
  async suaSoLuongChiTietXuatHuy(db: Db, maPXH: number, maSach: number, soLuong: number) {
    const r = await db.chiTietXuatHuy.updateMany({ where: { maPXH, maSach, phieuXuatHuy: { trangThai: "CHO_DUYET" } }, data: { soLuong } });
    return r.count === 1;
  },
  async xuLyXuatHuy(db: Db, maPXH: number, data: { trangThai: string; maTKDuyet: number; lyDoTuChoi?: string }) {
    const r = await db.phieuXuatHuy.updateMany({ where: { maPXH, trangThai: "CHO_DUYET" }, data: { ...data, ngayDuyet: new Date() } });
    return r.count === 1;
  },

  // ───────── Phiếu nhập ─────────
  danhSachPhieuNhap: (trangThai?: string) =>
    prisma.phieuNhap.findMany({
      where: trangThai ? { trangThai } : undefined,
      include: { nguoiLap: nguoi, nguoiDuyet: nguoi, nhaCungCap: { select: { tenNCC: true } }, _count: { select: { chiTiets: true } } },
      orderBy: { maPN: "desc" },
      take: 100,
    }),
  layPhieuNhap: (db: Db, maPN: number) =>
    db.phieuNhap.findUnique({
      where: { maPN },
      include: {
        nguoiLap: nguoi, nguoiDuyet: nguoi, nhaCungCap: true,
        chiTiets: { include: { sach: true }, orderBy: { sach: { tenSach: "asc" } } },
      },
    }),
  taoPhieuNhap: (db: Db, maTKLap: number, maNCC: number, ghiChu: string | null, tongTien: number, dong: { maSach: number; soLuong: number; giaNhap: number }[], trangThai = "CHO_DUYET") =>
    db.phieuNhap.create({ data: { maTKLap, maNCC, ghiChu, tongTien, trangThai, chiTiets: { create: dong } } }),
  /** UC7.3 2a – sửa SL thực nhận 1 dòng, chỉ khi phiếu còn CHO_DUYET (UPDATE có điều kiện). Trả về true nếu sửa được. */
  async suaSoLuongChiTietNhap(db: Db, maPN: number, maSach: number, soLuong: number) {
    const r = await db.chiTietPhieuNhap.updateMany({ where: { maPN, maSach, phieuNhap: { trangThai: "CHO_DUYET" } }, data: { soLuong } });
    return r.count === 1;
  },
  /** Tính lại tổng tiền phiếu nhập = Σ SL × giá nhập. */
  async tinhLaiTongTienNhap(db: Db, maPN: number) {
    const ct = await db.chiTietPhieuNhap.findMany({ where: { maPN } });
    const tongTien = ct.reduce((t, c) => t + c.soLuong * Number(c.giaNhap), 0);
    await db.phieuNhap.update({ where: { maPN }, data: { tongTien } });
    return tongTien;
  },
  async xuLyPhieuNhap(db: Db, maPN: number, data: { trangThai: string; maTKDuyet: number; lyDoTuChoi?: string }) {
    const r = await db.phieuNhap.updateMany({ where: { maPN, trangThai: "CHO_DUYET" }, data: { ...data, ngayDuyet: new Date() } });
    return r.count === 1;
  },

  demChoDuyet: async () => {
    const [phieuNhap, kiemKe, xuatHuy] = await Promise.all([
      prisma.phieuNhap.count({ where: { trangThai: "CHO_DUYET" } }),
      prisma.phieuKiemKe.count({ where: { trangThai: "CHO_DUYET" } }),
      prisma.phieuXuatHuy.count({ where: { trangThai: "CHO_DUYET" } }),
    ]);
    return { phieuNhap, kiemKe, xuatHuy };
  },
};
