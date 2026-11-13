// Tính tiền hóa đơn – hàm thuần (không truy cập DB), dùng chung cho POS và seed.
// Thứ tự (đã chốt):
//   Tạm tính → 1. Combo → 2. Ưu đãi hạng thẻ (%) → 3. Mã giảm giá → 4. Đổi điểm → 5. + VAT = Tổng tiền
//   - Combo: mỗi combo còn hiệu lực, đếm số BỘ đủ trong giỏ; giảm = (giá lẻ 1 bộ − giá combo) × số bộ.
//     Một cuốn chỉ tính cho 1 combo; combo tiết kiệm nhiều hơn/bộ được xét trước.
//   - Ưu đãi hạng tính trên số tiền sau combo.
//   - Mã giảm giá: điều kiện đơn tối thiểu xét trên số tiền SAU COMBO; % tính trên số tiền sau ưu đãi hạng.
//   - Điểm: 1 điểm = giaTriMotDiem, không vượt số tiền còn lại.
//   - VAT tính SAU giảm, một mức thuế suất chung THUE_SUAT_VAT cho cả hóa đơn.
//   - Điểm cộng = floor(tongTien / tyLeQuyDoiDiem) – không lưu trong CSDL, suy ra bằng tinhDiemCong().
// Tiền là VNĐ, làm tròn đến đồng. Hạn dùng / số lượt của mã giảm giá kiểm tra ở service gọi hàm này.

/** Thuế suất VAT (%) áp cho mọi hóa đơn. */
export const THUE_SUAT_VAT = 5;

/** Điểm khách được cộng cho một hóa đơn (dùng khi thanh toán và khi hủy để trừ lại). */
export const tinhDiemCong = (tongTien: number, tyLeQuyDoiDiem: number) =>
  tyLeQuyDoiDiem > 0 ? Math.floor(tongTien / tyLeQuyDoiDiem) : 0;

export type DongTinhTien = { maSach?: number; soLuong?: number; donGia?: number; thanhTien: number };

export type ComboTinhTien = {
  tenCombo: string;
  giaCombo: number;
  sach: { maSach: number; soLuong: number }[];
};

export type MaGiamGiaTinhTien = {
  loaiGiam: "PHAN_TRAM" | "SO_TIEN";
  giaTriGiam: number;
  giaTriDonToiThieu: number;
};

export type DauVaoTinhTien = {
  dong: DongTinhTien[];
  combos?: ComboTinhTien[]; // chỉ truyền combo còn hiệu lực
  phanTramUuDaiHang?: number; // 0 nếu khách vãng lai
  maGiamGia?: MaGiamGiaTinhTien | null;
  diemSuDung?: number;
  diemHienTai?: number; // điểm khách đang có
  giaTriMotDiem: number; // CauHinhHeThong.giaTriMotDiem
  tyLeQuyDoiDiem: number; // CauHinhHeThong.tyLeQuyDoiDiem
  coKhachHang?: boolean; // có KH thành viên mới được cộng điểm
};

export type ComboApDung = { tenCombo: string; soBo: number; giam: number };

export type KetQuaTinhTien = {
  tamTinh: number;
  giamCombo: number;
  giamHang: number;
  giamMa: number;
  giamDiem: number;
  tienGiam: number; // tổng 4 khoản giảm (chỉ để hiển thị)
  tienTruocThue: number;
  thueVAT: number;
  tongTien: number;
  diemCong: number; // điểm cộng cho khách sau thanh toán, tính trên tongTien
  combosApDung: ComboApDung[];
};

export class LoiTinhTien extends Error {}

/** Áp combo: trả về tổng giảm và danh sách combo áp dụng. */
function apCombo(dong: DongTinhTien[], combos: ComboTinhTien[]) {
  const conLai = new Map<number, number>(); // maSach → số cuốn chưa thuộc combo nào
  const viTri = new Map<number, number>(); // maSach → chỉ số dòng
  dong.forEach((d, i) => {
    if (d.maSach == null) return;
    conLai.set(d.maSach, (conLai.get(d.maSach) ?? 0) + (d.soLuong ?? 0));
    viTri.set(d.maSach, i);
  });
  const giaLe = (maSach: number) => {
    const d = dong[viTri.get(maSach)!];
    return d.donGia ?? d.thanhTien / (d.soLuong || 1);
  };

  // Combo tiết kiệm nhiều hơn mỗi bộ được xét trước
  const ung = combos
    .filter((c) => c.sach.length > 0 && c.sach.every((s) => viTri.has(s.maSach) && s.soLuong > 0))
    .map((c) => ({ c, giaLeBo: c.sach.reduce((t, s) => t + giaLe(s.maSach) * s.soLuong, 0) }))
    .filter((x) => x.giaLeBo > x.c.giaCombo)
    .sort((a, b) => b.giaLeBo - b.c.giaCombo - (a.giaLeBo - a.c.giaCombo));

  const combosApDung: ComboApDung[] = [];
  for (const { c, giaLeBo } of ung) {
    const soBo = Math.min(...c.sach.map((s) => Math.floor((conLai.get(s.maSach) ?? 0) / s.soLuong)));
    if (soBo <= 0) continue;
    const giamMotBo = giaLeBo - c.giaCombo;
    for (const s of c.sach) {
      conLai.set(s.maSach, conLai.get(s.maSach)! - s.soLuong * soBo);
    }
    combosApDung.push({ tenCombo: c.tenCombo, soBo, giam: giamMotBo * soBo });
  }
  return { giamCombo: combosApDung.reduce((t, c) => t + c.giam, 0), combosApDung };
}

export function tinhTienHoaDon(v: DauVaoTinhTien): KetQuaTinhTien {
  const tamTinh = v.dong.reduce((s, d) => s + d.thanhTien, 0);

  // 1. Combo
  const { giamCombo, combosApDung } = apCombo(v.dong, v.combos ?? []);
  const sauCombo = tamTinh - giamCombo;

  // 2. Ưu đãi hạng thẻ
  const giamHang = Math.round((sauCombo * (v.phanTramUuDaiHang ?? 0)) / 100);
  const sauHang = sauCombo - giamHang;

  // 3. Mã giảm giá (đơn tối thiểu xét trên số tiền sau combo)
  let giamMa = 0;
  if (v.maGiamGia) {
    const m = v.maGiamGia;
    if (sauCombo < m.giaTriDonToiThieu) {
      throw new LoiTinhTien(`Đơn chưa đạt giá trị tối thiểu ${m.giaTriDonToiThieu.toLocaleString("vi-VN")}đ để dùng mã`);
    }
    giamMa = m.loaiGiam === "PHAN_TRAM" ? Math.round((sauHang * m.giaTriGiam) / 100) : m.giaTriGiam;
    giamMa = Math.min(giamMa, sauHang);
  }
  const sauMa = sauHang - giamMa;

  // 4. Đổi điểm
  const diemSuDung = v.diemSuDung ?? 0;
  if (!Number.isInteger(diemSuDung) || diemSuDung < 0) throw new LoiTinhTien("Số điểm sử dụng không hợp lệ");
  if (diemSuDung > (v.diemHienTai ?? 0)) throw new LoiTinhTien("Khách không đủ điểm");
  const giamDiem = diemSuDung * v.giaTriMotDiem;
  if (giamDiem > sauMa) {
    throw new LoiTinhTien(`Tối đa dùng ${Math.floor(sauMa / v.giaTriMotDiem)} điểm cho đơn này`);
  }
  const tienTruocThue = sauMa - giamDiem;

  // 5. VAT sau giảm, một mức chung
  const thueVAT = Math.round((tienTruocThue * THUE_SUAT_VAT) / 100);

  const tongTien = tienTruocThue + thueVAT;
  const diemCong = v.coKhachHang ? tinhDiemCong(tongTien, v.tyLeQuyDoiDiem) : 0;

  return {
    tamTinh, giamCombo, giamHang, giamMa, giamDiem, tienGiam: giamCombo + giamHang + giamMa + giamDiem,
    tienTruocThue, thueVAT, tongTien, diemCong, combosApDung,
  };
}
