// Lớp thực thể CauHinhHeThong (1 dòng duy nhất, maCH = 1) – Bảng 3.77 (thuộc tính), Bảng 3.78 (phương thức).
import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/db";
import type { Prisma, CauHinhHeThong as CauHinhHeThongModel } from "@/lib/generated/prisma/client";
import { cauHinhRepository } from "@/lib/repositories/cauHinhRepository";

export type DuLieuCauHinh = Omit<Prisma.CauHinhHeThongUpdateInput, "maCH">;

export class CauHinhHeThong implements CauHinhHeThongModel {
  // ───── Thuộc tính ─────
  declare maCH: number;
  declare tenCuaHang: string;
  declare diaChi: string | null;
  declare soDienThoai: string | null;
  declare logo: string | null;
  declare maSoThue: string | null;
  declare tyLeQuyDoiDiem: Prisma.Decimal; // số tiền chi tiêu để được 1 điểm
  declare giaTriMotDiem: Prisma.Decimal; // giá trị 1 điểm khi đổi
  declare ttTienMat: boolean;
  declare ttQuetThe: boolean;
  declare ttMaQR: boolean;

  constructor(duLieu: CauHinhHeThongModel) {
    Object.assign(this, duLieu);
  }

  // ───── Phương thức ─────

  /** Lấy cấu hình hiện tại. */
  static async layCauHinh(db: Db = prisma): Promise<CauHinhHeThong> {
    return new CauHinhHeThong(await cauHinhRepository.lay(db));
  }

  /** Lưu thông số cấu hình mới (đã kiểm tra ở caiDatService). */
  async capNhat(cauHinh: DuLieuCauHinh, db: Db = prisma): Promise<boolean> {
    Object.assign(this, await cauHinhRepository.capNhat(db, cauHinh));
    return true;
  }

  /** Còn ít nhất một phương thức thanh toán đang bật. */
  static conPhuongThucBat(tt: Pick<CauHinhHeThongModel, "ttTienMat" | "ttQuetThe" | "ttMaQR">): boolean {
    return tt.ttTienMat || tt.ttQuetThe || tt.ttMaQR;
  }

  /** Phương thức `pt` có đang bật không. */
  batPhuongThuc(pt: "TIEN_MAT" | "QUET_THE" | "MA_QR"): boolean {
    return { TIEN_MAT: this.ttTienMat, QUET_THE: this.ttQuetThe, MA_QR: this.ttMaQR }[pt];
  }
}
