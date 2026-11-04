// Tính tiền hóa đơn – hàm thuần (không truy cập DB), dùng chung cho POS và seed.
// Thứ tự (đã chốt):
//   Tạm tính → 1. Combo → 2. Ưu đãi hạng thẻ (%) → 3. Mã giảm giá → 4. Đổi điểm → 5. + VAT = Tổng tiền
//   - Combo: mỗi combo còn hiệu lực, đếm số BỘ đủ trong giỏ; giảm = (giá lẻ 1 bộ − giá combo) × số bộ.
//     Một cuốn chỉ tính cho 1 combo; combo tiết kiệm nhiều hơn/bộ được xét trước.
//   - Ưu đãi hạng tính trên số tiền sau combo.
//   - Mã giảm giá: điều kiện đơn tối thiểu xét trên số tiền SAU COMBO; % tính trên số tiền sau ưu đãi hạng.
//   - Điểm: 1 điểm = giaTriMotDiem, không vượt số tiền còn lại.
//   - VAT tính SAU giảm: giảm combo phân bổ cho các dòng thuộc combo, các khoản giảm còn lại phân bổ
//     theo tỷ lệ tiền từng dòng; mỗi dòng chịu thuế suất của thể loại sách (0% hoặc 5%).
// Tiền là VNĐ, làm tròn đến đồng. Hạn dùng / số lượt của mã giảm giá kiểm tra ở service gọi hàm này.

export type DongTinhTien = { maSach?: number; soLuong?: number; donGia?: number; thanhTien: number; thueSuatVAT: number };

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

/** Áp combo: trả về tổng giảm, danh sách combo áp dụng và phần giảm phân bổ cho từng dòng (theo chỉ số dòng). */
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

  const phanBo = new Array<number>(dong.length).fill(0);
  const combosApDung: ComboApDung[] = [];
  for (const { c, giaLeBo } of ung) {
    const soBo = Math.min(...c.sach.map((s) => Math.floor((conLai.get(s.maSach) ?? 0) / s.soLuong)));
    if (soBo <= 0) continue;
    const giamMotBo = giaLeBo - c.giaCombo;
    for (const s of c.sach) {
      conLai.set(s.maSach, conLai.get(s.maSach)! - s.soLuong * soBo);
      phanBo[viTri.get(s.maSach)!] += ((giaLe(s.maSach) * s.soLuong) / giaLeBo) * giamMotBo * soBo;
    }
    combosApDung.push({ tenCombo: c.tenCombo, soBo, giam: giamMotBo * soBo });
  }
  return { giamCombo: combosApDung.reduce((t, c) => t + c.giam, 0), combosApDung, phanBo };
}

export function tinhTienHoaDon(v: DauVaoTinhTien): KetQuaTinhTien {
  const tamTinh = v.dong.reduce((s, d) => s + d.thanhTien, 0);

  // 1. Combo
  const { giamCombo, combosApDung, phanBo } = apCombo(v.dong, v.combos ?? []);
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

  // 5. VAT sau giảm, phân bổ theo dòng
  const heSo = sauCombo > 0 ? tienTruocThue / sauCombo : 0;
  const thueVAT = Math.round(
    v.dong.reduce((s, d, i) => s + ((d.thanhTien - phanBo[i]) * heSo * d.thueSuatVAT) / 100, 0),
  );

  const tongTien = tienTruocThue + thueVAT;
  const diemCong = v.coKhachHang ? Math.floor(tongTien / v.tyLeQuyDoiDiem) : 0;

  return {
    tamTinh, giamCombo, giamHang, giamMa, giamDiem, tienGiam: giamCombo + giamHang + giamMa + giamDiem,
    tienTruocThue, thueVAT, tongTien, diemCong, combosApDung,
  };
}
