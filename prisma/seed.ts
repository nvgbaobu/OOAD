// Seed dữ liệu mẫu – chạy: npx prisma db seed  (hoặc npx prisma migrate reset)
// Idempotent: xóa sạch dữ liệu cũ + reset IDENTITY rồi chèn lại.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import type { Sach, NhaCungCap } from "../lib/generated/prisma/client";
import { tinhTienHoaDon } from "../lib/services/tinhTienHoaDon";

const MAT_KHAU_MAC_DINH = "123456";

// Thứ tự xóa: bảng con trước, bảng cha sau
const BANG_XOA = [
  "ChiTietHoaDon", "HoaDon", "ChiTietCombo", "Combo", "ChiTietPhieuNhap", "PhieuNhap",
  "ChiTietKiemKe", "PhieuKiemKe", "ChiTietXuatHuy", "PhieuXuatHuy", "MaGiamGia",
  "KhachHang", "HangThanhVien", "Sach", "TheLoai", "NhaCungCap", "MaOTP",
  "NhatKyHeThong", "BanSaoLuu", "TaiKhoan", "CauHinhHeThong",
];
const BANG_IDENTITY = [
  "HoaDon", "Combo", "PhieuNhap", "PhieuKiemKe", "PhieuXuatHuy", "MaGiamGia", "KhachHang",
  "HangThanhVien", "Sach", "TheLoai", "NhaCungCap", "MaOTP", "NhatKyHeThong", "BanSaoLuu", "TaiKhoan",
];

async function xoaDuLieu() {
  for (const bang of BANG_XOA) await prisma.$executeRawUnsafe(`DELETE FROM [dbo].[${bang}]`);
  for (const bang of BANG_IDENTITY) await prisma.$executeRawUnsafe(`DBCC CHECKIDENT ('[dbo].[${bang}]', RESEED, 0)`);
}

const ngayTruoc = (soNgay: number, gio = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - soNgay);
  d.setHours(gio, 0, 0, 0);
  return d;
};

async function main() {
  await xoaDuLieu();

  // ── 19. Cấu hình hệ thống (1 dòng)
  await prisma.cauHinhHeThong.create({
    data: {
      maCH: 1,
      tenCuaHang: "Nhà sách Nhóm 09",
      diaChi: "273 An Dương Vương, Phường Chợ Quán, TP. Hồ Chí Minh",
      soDienThoai: "02838354409",
      maSoThue: "0312345678",
      tyLeQuyDoiDiem: 10000, // 10.000đ chi tiêu = 1 điểm
      giaTriMotDiem: 1000, // 1 điểm = 1.000đ khi đổi
    },
  });

  // ── 1. Tài khoản: 1 admin + 2 staff (mật khẩu chung 123456)
  const hash = await bcrypt.hash(MAT_KHAU_MAC_DINH, 10);
  const admin = await prisma.taiKhoan.create({
    data: { soDienThoai: "0900000001", matKhauHash: hash, hoTen: "Nguyễn Võ Gia Bảo", email: "admin@nhasach09.vn", vaiTro: "ADMIN" },
  });
  const staff1 = await prisma.taiKhoan.create({
    data: { soDienThoai: "0900000002", matKhauHash: hash, hoTen: "Lê Hoàng An", email: "an@nhasach09.vn", vaiTro: "STAFF" },
  });
  const staff2 = await prisma.taiKhoan.create({
    data: { soDienThoai: "0900000003", matKhauHash: hash, hoTen: "Quách Tuấn Hào", email: "hao@nhasach09.vn", vaiTro: "STAFF" },
  });

  // ── 5. Hạng thành viên
  const [hangDong, hangBac, hangVang] = await Promise.all([
    prisma.hangThanhVien.create({ data: { tenHang: "Đồng", diemToiThieu: 0, phanTramUuDai: 0 } }),
    prisma.hangThanhVien.create({ data: { tenHang: "Bạc", diemToiThieu: 500, phanTramUuDai: 5 } }),
    prisma.hangThanhVien.create({ data: { tenHang: "Vàng", diemToiThieu: 2000, phanTramUuDai: 10 } }),
  ]);

  // ── 3. Thể loại [tên, thuế suất VAT %]: 0% = chính trị/giáo dục/văn hóa (không chịu thuế GTGT), 5% = còn lại
  const dsTheLoai: [string, number][] = [
    ["Văn học Việt Nam", 5], ["Văn học nước ngoài", 5], ["Kinh tế", 5], ["Kỹ năng sống", 5], ["Thiếu nhi", 5],
    ["Khoa học", 0], ["Lịch sử", 0], ["Công nghệ thông tin", 5], ["Tâm lý", 5], ["Ngoại ngữ", 5],
    ["Giáo trình – Sách giáo khoa", 0], ["Chính trị – Pháp luật", 0],
  ];
  const theLoai: Record<string, number> = {};
  const thueSuatTheoTL: Record<number, number> = {};
  for (const [tenTL, thueSuatVAT] of dsTheLoai) {
    const tl = await prisma.theLoai.create({ data: { tenTL, thueSuatVAT } });
    theLoai[tenTL] = tl.maTL;
    thueSuatTheoTL[tl.maTL] = thueSuatVAT;
  }

  // ── 4. Sách (30 cuốn) [isbn, tên, tác giả, NXB, năm, thể loại, giá nhập, giá bán, kệ, tồn]
  const dsSach: [string, string, string, string, number, string, number, number, string, number][] = [
    ["9786042000001", "Mắt biếc", "Nguyễn Nhật Ánh", "NXB Trẻ", 2019, "Văn học Việt Nam", 70000, 110000, "A1-01", 40],
    ["9786042000002", "Cho tôi xin một vé đi tuổi thơ", "Nguyễn Nhật Ánh", "NXB Trẻ", 2018, "Văn học Việt Nam", 55000, 85000, "A1-02", 35],
    ["9786042000003", "Số đỏ", "Vũ Trọng Phụng", "NXB Văn học", 2020, "Văn học Việt Nam", 45000, 72000, "A1-03", 20],
    ["9786042000004", "Dế Mèn phiêu lưu ký", "Tô Hoài", "NXB Kim Đồng", 2021, "Thiếu nhi", 35000, 58000, "B1-01", 50],
    ["9786042000005", "Tắt đèn", "Ngô Tất Tố", "NXB Văn học", 2019, "Văn học Việt Nam", 40000, 65000, "A1-04", 3],
    ["9786042000006", "Nhà giả kim", "Paulo Coelho", "NXB Hội Nhà văn", 2020, "Văn học nước ngoài", 50000, 79000, "A2-01", 60],
    ["9786042000007", "Rừng Na Uy", "Haruki Murakami", "NXB Hội Nhà văn", 2018, "Văn học nước ngoài", 90000, 145000, "A2-02", 15],
    ["9786042000008", "Không gia đình", "Hector Malot", "NXB Văn học", 2017, "Văn học nước ngoài", 80000, 125000, "A2-03", 12],
    ["9786042000009", "Ông già và biển cả", "Ernest Hemingway", "NXB Văn học", 2019, "Văn học nước ngoài", 38000, 60000, "A2-04", 4],
    ["9786042000010", "Cha giàu cha nghèo", "Robert Kiyosaki", "NXB Trẻ", 2021, "Kinh tế", 75000, 120000, "C1-01", 30],
    ["9786042000011", "Nghĩ giàu và làm giàu", "Napoleon Hill", "NXB Tổng hợp", 2020, "Kinh tế", 65000, 105000, "C1-02", 25],
    ["9786042000012", "Từ tốt đến vĩ đại", "Jim Collins", "NXB Trẻ", 2019, "Kinh tế", 95000, 150000, "C1-03", 10],
    ["9786042000013", "Đắc nhân tâm", "Dale Carnegie", "NXB Tổng hợp", 2022, "Kỹ năng sống", 55000, 88000, "C2-01", 80],
    ["9786042000014", "Đời ngắn đừng ngủ dài", "Robin Sharma", "NXB Trẻ", 2020, "Kỹ năng sống", 45000, 75000, "C2-02", 22],
    ["9786042000015", "Tuổi trẻ đáng giá bao nhiêu", "Rosie Nguyễn", "NXB Hội Nhà văn", 2021, "Kỹ năng sống", 50000, 80000, "C2-03", 18],
    ["9786042000016", "Doraemon tập 1", "Fujiko F. Fujio", "NXB Kim Đồng", 2022, "Thiếu nhi", 15000, 25000, "B1-02", 100],
    ["9786042000017", "Thám tử lừng danh Conan tập 1", "Gosho Aoyama", "NXB Kim Đồng", 2022, "Thiếu nhi", 16000, 25000, "B1-03", 90],
    ["9786042000018", "Hoàng tử bé", "Antoine de Saint-Exupéry", "NXB Kim Đồng", 2020, "Thiếu nhi", 40000, 65000, "B1-04", 2],
    ["9786042000019", "Lược sử thời gian", "Stephen Hawking", "NXB Trẻ", 2019, "Khoa học", 85000, 135000, "D1-01", 14],
    ["9786042000020", "Vũ trụ", "Carl Sagan", "NXB Thế giới", 2020, "Khoa học", 120000, 189000, "D1-02", 8],
    ["9786042000021", "Sapiens: Lược sử loài người", "Yuval Noah Harari", "NXB Tri thức", 2021, "Lịch sử", 140000, 219000, "D2-01", 20],
    ["9786042000022", "Việt Nam sử lược", "Trần Trọng Kim", "NXB Văn học", 2018, "Lịch sử", 100000, 160000, "D2-02", 11],
    ["9786042000023", "Súng, vi trùng và thép", "Jared Diamond", "NXB Thế giới", 2020, "Lịch sử", 150000, 235000, "D2-03", 6],
    ["9786042000024", "Clean Code", "Robert C. Martin", "NXB Bách Khoa", 2021, "Công nghệ thông tin", 180000, 280000, "E1-01", 9],
    ["9786042000025", "Lập trình Python cơ bản", "Nhiều tác giả", "NXB Thông tin và Truyền thông", 2022, "Công nghệ thông tin", 90000, 140000, "E1-02", 16],
    ["9786042000026", "Phân tích thiết kế hướng đối tượng với UML", "Đặng Văn Đức", "NXB Giáo dục", 2019, "Giáo trình – Sách giáo khoa", 70000, 110000, "E1-03", 25],
    ["9786042000027", "Tư duy nhanh và chậm", "Daniel Kahneman", "NXB Thế giới", 2020, "Tâm lý", 130000, 205000, "F1-01", 13],
    ["9786042000028", "Sức mạnh của thói quen", "Charles Duhigg", "NXB Lao động", 2021, "Tâm lý", 80000, 129000, "F1-02", 17],
    ["9786042000029", "Hackers TOEIC Reading", "Hackers Academia", "NXB Tổng hợp", 2022, "Ngoại ngữ", 150000, 230000, "G1-01", 21],
    ["9786042000030", "English Grammar in Use", "Raymond Murphy", "NXB Cambridge", 2019, "Ngoại ngữ", 160000, 250000, "G1-02", 0],
  ];
  const sach: Sach[] = [];
  for (const [isbn, tenSach, tacGia, nhaXuatBan, namXB, tl, giaNhap, giaBan, viTriKe, soLuongTon] of dsSach) {
    sach.push(
      await prisma.sach.create({
        data: { isbn, tenSach, tacGia, nhaXuatBan, namXB, maTL: theLoai[tl], giaNhap, giaBan, viTriKe, soLuongTon },
      }),
    );
  }
  // 1 cuốn ngừng kinh doanh (ẩn khỏi POS)
  await prisma.sach.update({ where: { maSach: sach[29].maSach }, data: { trangThai: "NGUNG_KINH_DOANH" } });

  // ── 6. Khách hàng
  const dsKhach = [
    { soDienThoai: "0911111111", hoTen: "Trần Thị Mai", email: "mai@gmail.com", diaChi: "Quận 5, TP.HCM", diemHienTai: 120, diemTichLuy: 320, maHang: hangDong.maHang },
    { soDienThoai: "0922222222", hoTen: "Phạm Văn Nam", email: "nam@gmail.com", diaChi: "Quận 10, TP.HCM", diemHienTai: 450, diemTichLuy: 850, maHang: hangBac.maHang },
    { soDienThoai: "0933333333", hoTen: "Lê Thu Hà", diaChi: "Quận 1, TP.HCM", diemHienTai: 1500, diemTichLuy: 2600, maHang: hangVang.maHang },
    { soDienThoai: "0944444444", hoTen: "Đỗ Minh Khoa", email: "khoa@gmail.com", diemHienTai: 30, diemTichLuy: 30, maHang: hangDong.maHang },
    { soDienThoai: "0955555555", hoTen: "Hoàng Gia Linh", diaChi: "Thủ Đức, TP.HCM", diemHienTai: 600, diemTichLuy: 1200, maHang: hangBac.maHang },
    { soDienThoai: "0966666666", hoTen: "Vũ Ngọc Anh", diemHienTai: 0, diemTichLuy: 0, maHang: hangDong.maHang },
    { soDienThoai: "0977777777", hoTen: "Ngô Quốc Bảo", email: "bao.ngo@gmail.com", diemHienTai: 2100, diemTichLuy: 3400, maHang: hangVang.maHang },
    { soDienThoai: "0988888888", hoTen: "Bùi Thanh Tâm", diaChi: "Bình Thạnh, TP.HCM", diemHienTai: 75, diemTichLuy: 175, maHang: hangDong.maHang },
  ];
  const khach = [];
  for (const kh of dsKhach) khach.push(await prisma.khachHang.create({ data: kh, include: { hangThanhVien: true } }));

  // ── 12. Nhà cung cấp
  const ncc: NhaCungCap[] = [];
  for (const data of [
    { tenNCC: "Công ty TNHH Phát hành sách Fahasa", diaChi: "60-62 Lê Lợi, Quận 1, TP.HCM", maSoThue: "0304132047", nguoiLienHe: "Nguyễn Văn Hùng", soDienThoai: "02838225796" },
    { tenNCC: "Nhà xuất bản Trẻ", diaChi: "161B Lý Chính Thắng, Quận 3, TP.HCM", maSoThue: "0301234567", nguoiLienHe: "Trần Thị Lan", soDienThoai: "02839316289" },
    { tenNCC: "Công ty CP Sách Alpha", diaChi: "Hà Nội", maSoThue: "0102345678", nguoiLienHe: "Phạm Đức Minh", soDienThoai: "02437226234" },
    { tenNCC: "Nhà sách Phương Nam", diaChi: "Quận 3, TP.HCM", maSoThue: "0303456789", nguoiLienHe: "Lý Hoàng Yến", soDienThoai: "02838220000", trangThaiHopTac: "NGUNG_GIAO_DICH" },
  ]) ncc.push(await prisma.nhaCungCap.create({ data }));

  // ── 7. Mã giảm giá
  await prisma.maGiamGia.createMany({
    data: [
      { maCode: "GIAM10", loaiGiam: "PHAN_TRAM", giaTriGiam: 10, giaTriDonToiThieu: 200000, soLuongToiDa: 100, daSuDung: 12, ngayBatDau: ngayTruoc(30), ngayKetThuc: ngayTruoc(-60) },
      { maCode: "GIAM50K", loaiGiam: "SO_TIEN", giaTriGiam: 50000, giaTriDonToiThieu: 300000, soLuongToiDa: 50, daSuDung: 5, ngayBatDau: ngayTruoc(10), ngayKetThuc: ngayTruoc(-30) },
      { maCode: "SINHVIEN", loaiGiam: "PHAN_TRAM", giaTriGiam: 15, giaTriDonToiThieu: 0, soLuongToiDa: 200, daSuDung: 0, ngayBatDau: ngayTruoc(1), ngayKetThuc: ngayTruoc(-90) },
      { maCode: "TET2026", loaiGiam: "SO_TIEN", giaTriGiam: 30000, giaTriDonToiThieu: 150000, soLuongToiDa: 100, daSuDung: 100, ngayBatDau: ngayTruoc(300), ngayKetThuc: ngayTruoc(250) },
      { maCode: "HETLUOT", loaiGiam: "PHAN_TRAM", giaTriGiam: 20, giaTriDonToiThieu: 0, soLuongToiDa: 10, daSuDung: 10, ngayBatDau: ngayTruoc(5), ngayKetThuc: ngayTruoc(-5) },
    ],
  });

  // ── 8–9. Combo
  await prisma.combo.create({
    data: {
      tenCombo: "Combo Nguyễn Nhật Ánh", giaCombo: 175000, ngayBatDau: ngayTruoc(7), ngayKetThuc: ngayTruoc(-30),
      chiTiets: { create: [{ maSach: sach[0].maSach, soLuong: 1 }, { maSach: sach[1].maSach, soLuong: 1 }] },
    },
  });

  // ── 10–11. Một số hóa đơn đã thanh toán (VAT 0%/5% theo thể loại) cho Dashboard / màn hình Hóa đơn.
  // 3 đơn có khách thành viên (ưu đãi hạng + điểm cộng); điểm của khách ở trên coi như ĐÃ gồm điểm cộng này.
  // Tồn kho ở trên coi như ĐÃ trừ số bán này.
  const dsDon: { ngay: number; nv: number; tt: string; dong: [number, number][]; kh?: number }[] = [
    { ngay: 6, nv: staff1.maTK, tt: "TIEN_MAT", dong: [[0, 1], [12, 2]] },
    { ngay: 5, nv: staff2.maTK, tt: "MA_QR", dong: [[5, 1], [15, 3]], kh: 1 },
    { ngay: 4, nv: staff1.maTK, tt: "QUET_THE", dong: [[20, 1]] },
    { ngay: 3, nv: staff1.maTK, tt: "TIEN_MAT", dong: [[9, 1], [10, 1], [13, 1]], kh: 2 },
    { ngay: 2, nv: staff2.maTK, tt: "TIEN_MAT", dong: [[23, 1], [24, 1]] },
    { ngay: 1, nv: staff1.maTK, tt: "MA_QR", dong: [[16, 4], [3, 2]] },
    { ngay: 0, nv: staff2.maTK, tt: "TIEN_MAT", dong: [[6, 1], [26, 1]], kh: 0 },
  ];
  for (const don of dsDon) {
    const chiTiets = don.dong.map(([i, soLuong]) => {
      const donGiaBan = Number(sach[i].giaBan);
      const thueSuatVAT = thueSuatTheoTL[sach[i].maTL];
      return { maSach: sach[i].maSach, soLuong, donGiaBan, thanhTien: donGiaBan * soLuong, thueSuatVAT };
    });
    const kh = don.kh === undefined ? null : khach[don.kh];
    const tien = tinhTienHoaDon({
      dong: chiTiets, giaTriMotDiem: 1000, tyLeQuyDoiDiem: 10000,
      coKhachHang: !!kh, phanTramUuDaiHang: kh ? Number(kh.hangThanhVien.phanTramUuDai) : 0,
    });
    await prisma.hoaDon.create({
      data: {
        maTK: don.nv, maKH: kh?.maKH, thoiGianTao: ngayTruoc(don.ngay, 9 + don.ngay), trangThai: "DA_THANH_TOAN",
        tamTinh: tien.tamTinh, giamHangThe: tien.giamHang, thueVAT: tien.thueVAT, tongTien: tien.tongTien, diemCong: tien.diemCong,
        phuongThucTT: don.tt,
        tienKhachDua: don.tt === "TIEN_MAT" ? Math.ceil(tien.tongTien / 50000) * 50000 : tien.tongTien,
        chiTiets: { create: chiTiets },
      },
    });
  }

  // ── 13–14. Phiếu nhập: 1 đã duyệt, 1 chờ duyệt
  await prisma.phieuNhap.create({
    data: {
      maNCC: ncc[1].maNCC, maTKLap: staff1.maTK, maTKDuyet: admin.maTK, ngayLap: ngayTruoc(8), ngayDuyet: ngayTruoc(7),
      trangThai: "DA_DUYET", tongTien: 20 * 70000 + 20 * 55000, ghiChu: "Nhập bổ sung sách Nguyễn Nhật Ánh",
      chiTiets: { create: [{ maSach: sach[0].maSach, soLuong: 20, giaNhap: 70000 }, { maSach: sach[1].maSach, soLuong: 20, giaNhap: 55000 }] },
    },
  });
  await prisma.phieuNhap.create({
    data: {
      maNCC: ncc[0].maNCC, maTKLap: staff2.maTK, ngayLap: ngayTruoc(0, 8), trangThai: "CHO_DUYET",
      tongTien: 10 * 40000 + 15 * 40000, ghiChu: "Nhập sách sắp hết",
      chiTiets: { create: [{ maSach: sach[17].maSach, soLuong: 10, giaNhap: 40000 }, { maSach: sach[8].maSach, soLuong: 15, giaNhap: 40000 }] },
    },
  });

  // ── 15–16. Phiếu kiểm kê chờ duyệt
  await prisma.phieuKiemKe.create({
    data: {
      maTKLap: staff1.maTK, trangThai: "CHO_DUYET", ghiChu: "Kiểm kê kệ A1",
      chiTiets: {
        create: [
          { maSach: sach[0].maSach, slHeThong: sach[0].soLuongTon, slThucTe: sach[0].soLuongTon },
          { maSach: sach[2].maSach, slHeThong: sach[2].soLuongTon, slThucTe: sach[2].soLuongTon - 1, lyDoChenhLech: "Thất lạc 1 cuốn" },
        ],
      },
    },
  });

  // ── 17–18. Phiếu xuất hủy chờ duyệt
  await prisma.phieuXuatHuy.create({
    data: {
      maTKLap: staff2.maTK, trangThai: "CHO_DUYET", ghiChu: "Sách hư hỏng do ẩm",
      chiTiets: { create: [{ maSach: sach[3].maSach, soLuong: 2, lyDo: "Bìa rách, ố vàng" }] },
    },
  });

  // ── 20. Nhật ký
  await prisma.nhatKyHeThong.create({
    data: { maTK: admin.maTK, module: "HE_THONG", hanhDong: "SEED", noiDung: "Khởi tạo dữ liệu mẫu" },
  });

  console.log("✔ Seed xong. Đăng nhập: admin 0900000001 / staff 0900000002, 0900000003 – mật khẩu", MAT_KHAU_MAC_DINH);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
