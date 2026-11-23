// UC10.4 – Phục hồi CSDL từ bản sao lưu (chỉ Admin).
// Nguồn: (1) bản sao lưu đã tạo (bảng BanSaoLuu, file nằm trên máy chủ SQL Server) hoặc
//        (2) file .bak tải lên – chỉ khi cấu hình thư mục dùng chung giữa app và SQL Server
//            (THU_MUC_TAI_LEN_APP = đường dẫn app ghi file, THU_MUC_TAI_LEN_SQL = cùng thư mục nhìn từ SQL Server; xem docker-compose.yml).
// Quy trình: kiểm tra file (RESTORE VERIFYONLY + HEADERONLY đúng tên CSDL) → tự sao lưu trạng thái hiện tại →
// SINGLE_USER → RESTORE ... WITH REPLACE → luôn trả về MULTI_USER → ghi lại bản sao lưu an toàn + nhật ký vào CSDL mới.
// Chạy qua kết nối riêng tới master (mssql) vì phải ngắt mọi kết nối đang dùng CSDL của ứng dụng.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sql from "mssql";
import { prisma } from "@/lib/prisma";
import { LoiNghiepVu } from "@/lib/loi";
import { caiDatService } from "@/lib/services/caiDatService";
import { nhatKyRepository } from "@/lib/repositories/nhatKyRepository";

const TEN_DB = () => {
  const db = process.env.DB_NAME ?? "QuanLyBanSach";
  if (!/^\w+$/.test(db)) throw new Error("DB_NAME không hợp lệ");
  return db;
};
const DUONG_DAN_HOP_LE = /^\/[\w./-]+\.bak$/; // chỉ chữ, số, _ - . / → ghép vào câu lệnh an toàn
export const TAI_LEN_TOI_DA = 500 * 1024 * 1024;

/** Có bật tải file .bak lên không (cần thư mục dùng chung app ↔ SQL Server). */
export const choPhepTaiLen = () => !!(process.env.THU_MUC_TAI_LEN_APP && process.env.THU_MUC_TAI_LEN_SQL);

async function ketNoiMaster() {
  const pool = new sql.ConnectionPool({
    server: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 1433),
    database: "master",
    user: process.env.DB_USER ?? "sa",
    password: process.env.DB_PASSWORD ?? "",
    options: { encrypt: true, trustServerCertificate: true },
    requestTimeout: 10 * 60_000,
  });
  return pool.connect();
}

/** Kiểm tra file sao lưu đọc được và đúng là bản sao lưu của CSDL ứng dụng. */
async function kiemTraFile(pool: sql.ConnectionPool, duongDan: string, db: string) {
  try {
    await pool.request().batch(`RESTORE VERIFYONLY FROM DISK = N'${duongDan}'`);
    const h = await pool.request().batch(`RESTORE HEADERONLY FROM DISK = N'${duongDan}'`);
    const tenGoc = h.recordset?.[0]?.DatabaseName as string | undefined;
    if (tenGoc && tenGoc !== db) throw new LoiNghiepVu(`File là bản sao lưu của CSDL "${tenGoc}", không phải "${db}"`);
  } catch (e) {
    if (e instanceof LoiNghiepVu) throw e;
    throw new LoiNghiepVu(`File sao lưu không hợp lệ hoặc bị lỗi – dữ liệu hiện tại được giữ nguyên (${e instanceof Error ? e.message.slice(0, 160) : e})`);
  }
}

/** Đợi kết nối Prisma dùng lại được sau khi CSDL bị ngắt kết nối/phục hồi. */
async function choKetNoiLai() {
  for (let i = 0; i < 5; i++) {
    try { await prisma.$queryRaw`SELECT 1`; return; } catch { await new Promise((r) => setTimeout(r, 500)); }
  }
}

type DongSaoLuu = { maTK: number; thoiGian: Date; duongDanFile: string; kichThuoc: bigint | number };

/** Sau RESTORE, CSDL không có các dòng BanSaoLuu tạo sau thời điểm file .bak → ghi lại nếu thiếu (so theo đường dẫn). */
async function damBaoCoDongSaoLuu(dongs: DongSaoLuu[]) {
  for (const d of dongs) {
    const daCo = await prisma.banSaoLuu.findFirst({ where: { duongDanFile: d.duongDanFile }, select: { maBackup: true } });
    if (!daCo) await prisma.banSaoLuu.create({ data: { maTK: d.maTK, thoiGian: d.thoiGian, duongDanFile: d.duongDanFile, kichThuoc: d.kichThuoc } });
  }
}

async function phucHoiTuDuongDan(duongDan: string, moTaNguon: string, maTK: number, giuLai: DongSaoLuu[] = []) {
  if (!DUONG_DAN_HOP_LE.test(duongDan)) throw new LoiNghiepVu("Đường dẫn file sao lưu không hợp lệ");
  const db = TEN_DB();
  const pool = await ketNoiMaster();
  try {
    await kiemTraFile(pool, duongDan, db);
    // Bản sao lưu an toàn của trạng thái hiện tại – để quay lại nếu phục hồi nhầm
    const anToan = await caiDatService.saoLuu(maTK, "_truocPhucHoi");
    try {
      await pool.request().batch(`ALTER DATABASE [${db}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE`);
      await pool.request().batch(`RESTORE DATABASE [${db}] FROM DISK = N'${duongDan}' WITH REPLACE`);
    } catch (e) {
      throw new LoiNghiepVu(`Phục hồi thất bại – dữ liệu hiện tại được giữ nguyên (${e instanceof Error ? e.message.slice(0, 200) : e})`);
    } finally {
      await pool.request().batch(`IF DB_ID(N'${db}') IS NOT NULL ALTER DATABASE [${db}] SET MULTI_USER`).catch(() => undefined);
    }
    await choKetNoiLai();
    // CSDL vừa phục hồi không có dòng của bản nguồn (nếu nó được tạo sau thời điểm của chính file .bak),
    // bản sao lưu an toàn và nhật ký lần này → ghi lại
    await damBaoCoDongSaoLuu([...giuLai, { maTK, thoiGian: anToan.thoiGian, duongDanFile: anToan.duongDanFile, kichThuoc: anToan.kichThuoc }]).catch(() => undefined);
    await nhatKyRepository.ghi({ maTK, module: "CAI_DAT", hanhDong: "PHUC_HOI", noiDung: `Phục hồi từ ${moTaNguon}. Bản sao lưu trước khi phục hồi: ${anToan.duongDanFile}` }).catch(() => undefined);
    return { anToan: anToan.duongDanFile };
  } finally {
    await pool.close();
  }
}

export const phucHoiService = {
  /** Phục hồi từ một bản sao lưu đã có trong danh sách. */
  async tuBanSaoLuu(maBackup: number, maTK: number) {
    const bs = Number.isInteger(maBackup) ? await prisma.banSaoLuu.findUnique({ where: { maBackup } }) : null;
    if (!bs) throw new LoiNghiepVu("Không tìm thấy bản sao lưu");
    return phucHoiTuDuongDan(bs.duongDanFile, `bản sao lưu #${bs.maBackup} (${bs.duongDanFile})`, maTK, [bs]);
  },

  /** Phục hồi từ file .bak tải lên (cần thư mục dùng chung app ↔ SQL Server). */
  async tuFileTaiLen(file: File | null, maTK: number) {
    if (!choPhepTaiLen()) throw new LoiNghiepVu("Chưa cấu hình thư mục dùng chung để tải file sao lưu lên (chạy bằng Docker Compose)");
    if (!file || file.size === 0) throw new LoiNghiepVu("Chọn file sao lưu (.bak)", { file: "Chọn file .bak" });
    if (!/\.bak$/i.test(file.name)) throw new LoiNghiepVu("File sao lưu phải có đuôi .bak", { file: "Chỉ nhận file .bak" });
    if (file.size > TAI_LEN_TOI_DA) throw new LoiNghiepVu("File tối đa 500 MB", { file: "Tối đa 500 MB" });
    const ten = `tai-len_${Date.now()}.bak`;
    const thuMucApp = process.env.THU_MUC_TAI_LEN_APP!;
    await mkdir(thuMucApp, { recursive: true });
    await writeFile(path.join(thuMucApp, ten), Buffer.from(await file.arrayBuffer()), { mode: 0o644 });
    return phucHoiTuDuongDan(`${process.env.THU_MUC_TAI_LEN_SQL!.replace(/\/$/, "")}/${ten}`, `file tải lên "${file.name}"`, maTK);
  },
};
