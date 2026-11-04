// Phiếu kiểm kê (PhieuKiemKe/ChiTietKiemKe) và phiếu xuất hủy (PhieuXuatHuy/ChiTietXuatHuy).
// Hai loại phiếu có cùng vòng đời CHO_DUYET → DA_DUYET | TU_CHOI nên gom chung 1 repository.
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
  taoKiemKe: (db: Db, maTKLap: number, ghiChu: string | null, dong: { maSach: number; slHeThong: number; slThucTe: number; lyDoChenhLech: string | null }[]) =>
    db.phieuKiemKe.create({ data: { maTKLap, ghiChu, trangThai: "CHO_DUYET", chiTiets: { create: dong } } }),
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
  taoXuatHuy: (db: Db, maTKLap: number, ghiChu: string | null, dong: { maSach: number; soLuong: number; lyDo: string }[]) =>
    db.phieuXuatHuy.create({ data: { maTKLap, ghiChu, trangThai: "CHO_DUYET", chiTiets: { create: dong } } }),
  async xuLyXuatHuy(db: Db, maPXH: number, data: { trangThai: string; maTKDuyet: number; lyDoTuChoi?: string }) {
    const r = await db.phieuXuatHuy.updateMany({ where: { maPXH, trangThai: "CHO_DUYET" }, data: { ...data, ngayDuyet: new Date() } });
    return r.count === 1;
  },

  demChoDuyet: async () => {
    const [kiemKe, xuatHuy] = await Promise.all([
      prisma.phieuKiemKe.count({ where: { trangThai: "CHO_DUYET" } }),
      prisma.phieuXuatHuy.count({ where: { trangThai: "CHO_DUYET" } }),
    ]);
    return { kiemKe, xuatHuy };
  },
};
