// Tính tiền hóa đơn – hàm thuần (không truy cập DB), dùng chung cho POS và seed.
// Thứ tự (đã chốt 04/11/2026):
//   1. Ưu đãi hạng thẻ (% trên tạm tính)
//   2. Mã giảm giá (điều kiện đơn tối thiểu xét trên số tiền SAU ưu đãi hạng)
//   3. Đổi điểm (1 điểm = giaTriMotDiem, không vượt quá số tiền còn lại)
//   4. VAT tính SAU giảm: tổng giảm được phân bổ theo tỷ lệ thành tiền từng dòng,
//      mỗi dòng chịu thuế suất của thể loại sách (0% hoặc 5%).
// Tiền là VNĐ, làm tròn đến đồng. Hạn dùng / số lượt của mã giảm giá kiểm tra ở service gọi hàm này.

export type DongTinhTien = { thanhTien: number; thueSuatVAT: number };

export type MaGiamGiaTinhTien = {
  loaiGiam: "PHAN_TRAM" | "SO_TIEN";
  giaTriGiam: number;
  giaTriDonToiThieu: number;
};

export type DauVaoTinhTien = {
  dong: DongTinhTien[];
  phanTramUuDaiHang?: number; // 0 nếu khách vãng lai
  maGiamGia?: MaGiamGiaTinhTien | null;
  diemSuDung?: number;
  diemHienTai?: number; // điểm khách đang có
  giaTriMotDiem: number; // CauHinhHeThong.giaTriMotDiem
  tyLeQuyDoiDiem: number; // CauHinhHeThong.tyLeQuyDoiDiem
  coKhachHang?: boolean; // có KH thành viên mới được cộng điểm
};

export type KetQuaTinhTien = {
  tamTinh: number;
  giamHang: number;
  giamMa: number;
  giamDiem: number;
  tienGiam: number; // = giamHang + giamMa + giamDiem (lưu vào HoaDon.tienGiam)
  tienTruocThue: number;
  thueVAT: number;
  tongTien: number;
  diemCong: number; // điểm cộng cho khách sau thanh toán, tính trên tongTien
};

export class LoiTinhTien extends Error {}

export function tinhTienHoaDon(v: DauVaoTinhTien): KetQuaTinhTien {
  const tamTinh = v.dong.reduce((s, d) => s + d.thanhTien, 0);

  // 1. Ưu đãi hạng thẻ
  const giamHang = Math.round((tamTinh * (v.phanTramUuDaiHang ?? 0)) / 100);
  const sauHang = tamTinh - giamHang;

  // 2. Mã giảm giá
  let giamMa = 0;
  if (v.maGiamGia) {
    const m = v.maGiamGia;
    if (sauHang < m.giaTriDonToiThieu) {
      throw new LoiTinhTien(`Đơn chưa đạt giá trị tối thiểu ${m.giaTriDonToiThieu.toLocaleString("vi-VN")}đ để dùng mã`);
    }
    giamMa = m.loaiGiam === "PHAN_TRAM" ? Math.round((sauHang * m.giaTriGiam) / 100) : m.giaTriGiam;
    giamMa = Math.min(giamMa, sauHang);
  }
  const sauMa = sauHang - giamMa;

  // 3. Đổi điểm
  const diemSuDung = v.diemSuDung ?? 0;
  if (diemSuDung < 0) throw new LoiTinhTien("Số điểm sử dụng không hợp lệ");
  if (diemSuDung > (v.diemHienTai ?? 0)) throw new LoiTinhTien("Khách không đủ điểm");
  const giamDiem = diemSuDung * v.giaTriMotDiem;
  if (giamDiem > sauMa) {
    throw new LoiTinhTien(`Tối đa dùng ${Math.floor(sauMa / v.giaTriMotDiem)} điểm cho đơn này`);
  }
  const tienTruocThue = sauMa - giamDiem;

  // 4. VAT sau giảm, phân bổ theo dòng
  const heSo = tamTinh > 0 ? tienTruocThue / tamTinh : 0;
  const thueVAT = Math.round(v.dong.reduce((s, d) => s + (d.thanhTien * heSo * d.thueSuatVAT) / 100, 0));

  const tongTien = tienTruocThue + thueVAT;
  const diemCong = v.coKhachHang ? Math.floor(tongTien / v.tyLeQuyDoiDiem) : 0;

  return { tamTinh, giamHang, giamMa, giamDiem, tienGiam: giamHang + giamMa + giamDiem, tienTruocThue, thueVAT, tongTien, diemCong };
}
