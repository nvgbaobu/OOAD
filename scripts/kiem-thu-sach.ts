// Kiểm thử nghiệp vụ Quản lý sách trên DB thật. Chạy: npm run test:sach (chạy xong tự seed lại)
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { LoiNghiepVu } from "../lib/loi";
import { sachService, type FormSach } from "../lib/services/sachService";
import { posService } from "../lib/services/posService";

let loi = 0;
const kiemTra = (dk: boolean, moTa: string) => { console.log(dk ? "  ✔" : "  ✘", moTa); if (!dk) loi++; };
async function phaiLoi(fn: () => Promise<unknown>, truong: string | null, chua: string) {
  try { await fn(); kiemTra(false, `phải báo lỗi "${chua}"`); }
  catch (e) {
    const msg = e instanceof LoiNghiepVu ? (truong ? e.loiTruong?.[truong] : e.message) ?? "" : String(e);
    kiemTra(e instanceof LoiNghiepVu && msg.includes(chua), `báo lỗi${truong ? ` ô ${truong}` : ""}: ${msg}`);
  }
}

async function main() {
  const admin = 1;
  const kyNang = await prisma.theLoai.findUniqueOrThrow({ where: { tenTL: "Kỹ năng sống" } });
  const mau: FormSach = {
    isbn: "978-604-1-23456-7", tenSach: "  Atomic   Habits ", tacGia: "James Clear", nhaXuatBan: "NXB Thế giới", namXB: "2023",
    maTL: String(kyNang.maTL), giaNhap: "90000", giaBan: "150000", viTriKe: "C2-04", dinhMucToiThieu: "", hinhAnh: "",
  };

  console.log("1. Thêm sách");
  await phaiLoi(() => sachService.tao({ ...mau, giaBan: "80000" }, admin), "giaBan", "≥ giá nhập");
  await phaiLoi(() => sachService.tao({ ...mau, isbn: "12345" }, admin), "isbn", "10 hoặc 13");
  await phaiLoi(() => sachService.tao({ ...mau, isbn: "9786042000013" }, admin), "isbn", "Đắc nhân tâm");
  await phaiLoi(() => sachService.tao({ ...mau, tenSach: " ", namXB: "1800", maTL: "" }, admin), "namXB", "1900");
  await phaiLoi(() => sachService.tao({ ...mau, tenSach: " ", maTL: "" }, admin), "maTL", "Chọn thể loại");
  const moi = await sachService.tao(mau, admin);
  kiemTra(moi.isbn === "9786041234567" && moi.tenSach === "Atomic Habits", "chuẩn hóa ISBN và tên");
  kiemTra(moi.soLuongTon === 0 && moi.dinhMucToiThieu === 5 && moi.trangThai === "DANG_BAN", "tồn 0, định mức mặc định 5, đang bán");

  console.log("2. Sửa sách");
  await sachService.capNhat(moi.maSach, { ...mau, giaBan: "159000" }, admin);
  kiemTra(Number((await sachService.layChiTiet(moi.maSach))!.giaBan) === 159000, "cập nhật giá bán");
  await phaiLoi(() => sachService.capNhat(moi.maSach, { ...mau, isbn: "9786042000001" }, admin), "isbn", "Mắt biếc");
  await sachService.capNhat(moi.maSach, mau, admin); // giữ nguyên ISBN của chính nó → không báo trùng
  kiemTra(true, "lưu lại với ISBN của chính nó không báo trùng");
  const nk = await prisma.nhatKyHeThong.findFirstOrThrow({ where: { module: "SACH", hanhDong: "SUA" }, orderBy: { maLog: "desc" } });
  kiemTra(!!nk.noiDung?.includes("giaBan: 159000 → 150000"), `nhật ký ghi thay đổi giá: ${nk.noiDung}`);

  console.log("3. Ngừng kinh doanh / mở bán lại");
  const matBiec = await prisma.sach.findUniqueOrThrow({ where: { isbn: "9786042000001" } });
  await sachService.doiTrangThai(matBiec.maSach, "NGUNG_KINH_DOANH", admin);
  await phaiLoi(() => posService.themSach(2, matBiec.maSach), null, "ngừng kinh doanh");
  kiemTra(!(await posService.timSach("Mắt biếc")).some((s) => s.maSach === matBiec.maSach), "ẩn khỏi tìm kiếm POS");
  await sachService.doiTrangThai(matBiec.maSach, "DANG_BAN", admin);
  await posService.themSach(2, matBiec.maSach);
  kiemTra(true, "mở bán lại → POS thêm được");
  await posService.huyDon(2);

  console.log("4. Danh sách + lọc");
  const tongSach = await prisma.sach.count();
  const soTrang = Math.ceil(tongSach / 15);
  const tatCa = await sachService.danhSach({}, 1);
  kiemTra(tatCa.tong === tongSach && tatCa.soTrang === soTrang && tatCa.sachs.length === 15, `${tongSach} sách, ${soTrang} trang (${tatCa.tong}, ${tatCa.soTrang})`);
  const trangCuoi = await sachService.danhSach({}, 99);
  kiemTra(trangCuoi.trang === soTrang && trangCuoi.sachs.length === tongSach - (soTrang - 1) * 15, "trang vượt quá → về trang cuối");
  const sapHet = await sachService.danhSach({ sapHet: true }, 1);
  kiemTra(sapHet.sachs.every((s) => s.soLuongTon <= s.dinhMucToiThieu) && sapHet.tong >= 5, `lọc sắp hết: ${sapHet.tong} sách`);
  const ngung = await sachService.danhSach({ trangThai: "NGUNG_KINH_DOANH" }, 1);
  kiemTra(ngung.tong === 1 && ngung.sachs[0].isbn === "9786042000030", "lọc ngừng kinh doanh");
  kiemTra((await sachService.danhSach({ tuKhoa: "harari" }, 1)).tong === 1, "tìm theo tác giả (không phân biệt hoa thường)");

  console.log("5. Thể loại");
  await phaiLoi(() => sachService.luuTheLoai(null, "Kinh tế", admin), "tenTL", "đã tồn tại");
  const tl = await sachService.luuTheLoai(null, "  Truyện   tranh ", admin);
  kiemTra(tl.tenTL === "Truyện tranh", "thêm thể loại (chuẩn hóa khoảng trắng)");
  await sachService.luuTheLoai(tl.maTL, "Truyện tranh Nhật", admin);
  kiemTra((await prisma.theLoai.findUniqueOrThrow({ where: { maTL: tl.maTL } })).tenTL === "Truyện tranh Nhật", "sửa tên thể loại");
  await phaiLoi(() => sachService.xoaTheLoai(kyNang.maTL, admin), null, "đang có");
  await sachService.xoaTheLoai(tl.maTL, admin);
  kiemTra(!(await prisma.theLoai.findUnique({ where: { maTL: tl.maTL } })), "xóa thể loại chưa có sách");

  console.log(loi ? `\n✘ ${loi} kiểm tra thất bại` : "\n✔ Tất cả kiểm tra đạt");
  process.exitCode = loi ? 1 : 0;
}
main().finally(() => prisma.$disconnect());
