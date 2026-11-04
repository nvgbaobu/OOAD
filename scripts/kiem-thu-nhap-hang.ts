// Kiểm thử nghiệp vụ Nhà cung cấp + Phiếu nhập trên DB thật. Chạy: npm run test:nhap (chạy xong tự seed lại)
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { LoiNghiepVu } from "../lib/loi";
import { nhaCungCapService, type FormNhaCungCap } from "../lib/services/nhaCungCapService";
import { khoService } from "../lib/services/khoService";
import { sachService, type FormSach } from "../lib/services/sachService";

let loi = 0;
const kiemTra = (dk: boolean, moTa: string) => { console.log(dk ? "  ✔" : "  ✘", moTa); if (!dk) loi++; };
async function phaiLoi(fn: () => Promise<unknown>, truong: string | null, chua: string) {
  try { await fn(); kiemTra(false, `phải báo lỗi "${chua}"`); }
  catch (e) {
    const msg = e instanceof LoiNghiepVu ? (truong ? e.loiTruong?.[truong] : e.message) ?? "" : String(e);
    kiemTra(e instanceof LoiNghiepVu && msg.includes(chua), `báo lỗi${truong ? ` ô ${truong}` : ""}: ${msg}`);
  }
}
const sach = (isbn: string) => prisma.sach.findUniqueOrThrow({ where: { isbn } });

async function main() {
  const admin = 1, staff = 2;

  console.log("1. Nhà cung cấp");
  const mau: FormNhaCungCap = { tenNCC: "  Công ty  Sách Đông A ", maSoThue: "0312 345 678", diaChi: "Hà Nội", nguoiLienHe: "Lê Văn Tâm", soDienThoai: "0912.345.678" };
  await phaiLoi(() => nhaCungCapService.tao({ ...mau, maSoThue: "12345" }, admin), "maSoThue", "10 số");
  await phaiLoi(() => nhaCungCapService.tao({ ...mau, maSoThue: "0304132047" }, admin), "maSoThue", "Fahasa");
  await phaiLoi(() => nhaCungCapService.tao({ ...mau, soDienThoai: "12345" }, admin), "soDienThoai", "bắt đầu bằng 0");
  await phaiLoi(() => nhaCungCapService.tao({ ...mau, tenNCC: " " }, admin), "tenNCC", "Nhập tên");
  const dongA = await nhaCungCapService.tao(mau, admin);
  kiemTra(dongA.tenNCC === "Công ty Sách Đông A" && dongA.maSoThue === "0312345678" && dongA.soDienThoai === "0912345678", "chuẩn hóa tên, MST, SĐT");
  const chiNhanh = await nhaCungCapService.tao({ ...mau, maSoThue: "0312345678-001", soDienThoai: "" }, admin);
  kiemTra(chiNhanh.maSoThue === "0312345678-001" && chiNhanh.soDienThoai === null, "MST chi nhánh 10-3 số, SĐT bỏ trống được");
  await phaiLoi(() => nhaCungCapService.capNhat(chiNhanh.maNCC, { ...mau, maSoThue: "0312345678" }, admin), "maSoThue", "đã có");
  await nhaCungCapService.capNhat(dongA.maNCC, { ...mau, nguoiLienHe: "Phạm Thu Hà" }, admin);
  kiemTra((await prisma.nhaCungCap.findUniqueOrThrow({ where: { maNCC: dongA.maNCC } })).nguoiLienHe === "Phạm Thu Hà", "sửa NCC (giữ MST của chính nó)");
  await nhaCungCapService.xoa(chiNhanh.maNCC, admin);
  kiemTra(!(await prisma.nhaCungCap.findUnique({ where: { maNCC: chiNhanh.maNCC } })), "xóa NCC chưa có phiếu nhập");
  const fahasa = await prisma.nhaCungCap.findUniqueOrThrow({ where: { maSoThue: "0304132047" } });
  await phaiLoi(() => nhaCungCapService.xoa(fahasa.maNCC, admin), null, "Ngừng giao dịch");
  kiemTra(!(await khoService.nhaCungCapDeChon()).some((n) => n.tenNCC.includes("Phương Nam")), "NCC ngừng giao dịch không có trong danh sách chọn");

  console.log("2. Lập phiếu nhập");
  const hoangTuBe = await sach("9786042000018"); // tồn 2, giá nhập 40.000, giá bán 65.000
  const nhaGiaKim = await sach("9786042000006"); // tồn 60, giá nhập 50.000, giá bán 79.000
  const englishGrammar = await sach("9786042000030"); // ngừng kinh doanh
  const phuongNam = await prisma.nhaCungCap.findFirstOrThrow({ where: { trangThaiHopTac: "NGUNG_GIAO_DICH" } });
  const d = (s: { maSach: number }, sl: number | string, gia: number | string) => ({ maSach: String(s.maSach), soLuong: String(sl), giaNhap: String(gia) });
  await phaiLoi(() => khoService.lapPhieuNhap("", "", [d(hoangTuBe, 5, 40000)], staff), "maNCC", "Chọn nhà cung cấp");
  await phaiLoi(() => khoService.lapPhieuNhap(String(phuongNam.maNCC), "", [d(hoangTuBe, 5, 40000)], staff), "maNCC", "ngừng giao dịch");
  await phaiLoi(() => khoService.lapPhieuNhap(String(dongA.maNCC), "", [d(englishGrammar, 5, 100000)], staff), `dong.${englishGrammar.maSach}`, "ngừng kinh doanh");
  await phaiLoi(() => khoService.lapPhieuNhap(String(dongA.maNCC), "", [d(hoangTuBe, 0, 40000)], staff), `dong.${hoangTuBe.maSach}`, "> 0");
  await phaiLoi(() => khoService.lapPhieuNhap(String(dongA.maNCC), "", [d(hoangTuBe, 5, 70000)], staff), `dong.${hoangTuBe.maSach}`, "cao hơn giá bán");
  const pn = await khoService.lapPhieuNhap(String(dongA.maNCC), "Nhập đợt 1", [d(hoangTuBe, 20, 42000), d(nhaGiaKim, 10, "50.000")], staff);
  kiemTra(Number(pn.tongTien) === 20 * 42000 + 10 * 50000 && pn.trangThai === "CHO_DUYET", `tổng tiền ${Number(pn.tongTien)}, chờ duyệt`);
  kiemTra((await sach(hoangTuBe.isbn)).soLuongTon === 2, "lập phiếu chưa cộng kho");

  console.log("3. Duyệt phiếu nhập");
  await khoService.duyetPhieuNhap(pn.maPN, admin);
  const htb = await sach(hoangTuBe.isbn);
  kiemTra(htb.soLuongTon === 22 && Number(htb.giaNhap) === 42000, `Hoàng tử bé: tồn 2 + 20 = ${htb.soLuongTon}, giá nhập 40.000 → ${Number(htb.giaNhap)}`);
  kiemTra((await sach(nhaGiaKim.isbn)).soLuongTon === 70, "Nhà giả kim: 60 + 10 = 70");
  const nk = await prisma.nhatKyHeThong.findFirstOrThrow({ where: { hanhDong: "DUYET_PHIEU_NHAP" }, orderBy: { maLog: "desc" } });
  kiemTra(!!nk.noiDung?.includes("40000 → 42000") && !nk.noiDung.includes("Nhà giả kim: "), `nhật ký ghi đổi giá nhập: ${nk.noiDung}`);
  await phaiLoi(() => khoService.duyetPhieuNhap(pn.maPN, admin), null, "đã được xử lý");
  kiemTra((await sach(hoangTuBe.isbn)).soLuongTon === 22, "duyệt lần 2 không cộng thêm");
  const tk = (await nhaCungCapService.layChiTiet(dongA.maNCC))!.thongKe;
  kiemTra(tk.soPhieu === 1 && tk.tongTien === 1340000, `thống kê NCC: ${tk.soPhieu} phiếu, ${tk.tongTien}đ`);

  console.log("4. Giá bán bị hạ sau khi lập phiếu → không duyệt được");
  // Chi tiết xử lý theo tên sách: Hoàng tử bé (hợp lệ) trước, Nhà giả kim (lỗi) sau → kiểm tra rollback dòng đã xử lý
  const pn2 = await khoService.lapPhieuNhap(String(dongA.maNCC), "", [d(hoangTuBe, 5, 42000), d(nhaGiaKim, 5, 70000)], staff);
  const ngk = await sach(nhaGiaKim.isbn);
  const formNGK = Object.fromEntries(
    (["isbn", "tenSach", "tacGia", "nhaXuatBan", "namXB", "maTL", "giaNhap", "giaBan", "viTriKe", "dinhMucToiThieu", "hinhAnh"] as const)
      .map((k) => [k, String(ngk[k] ?? "")]),
  ) as FormSach;
  await sachService.capNhat(ngk.maSach, { ...formNGK, giaBan: "60000" }, admin);
  await phaiLoi(() => khoService.duyetPhieuNhap(pn2.maPN, admin), null, "cao hơn giá bán");
  kiemTra((await sach(hoangTuBe.isbn)).soLuongTon === 22 && (await khoService.layPhieuNhap(pn2.maPN))!.trangThai === "CHO_DUYET",
    "rollback cả phiếu: Hoàng tử bé (dòng đã xử lý) không bị cộng, phiếu vẫn chờ duyệt");
  await khoService.tuChoiPhieuNhap(pn2.maPN, "Giá nhập quá cao", admin);
  kiemTra((await khoService.layPhieuNhap(pn2.maPN))!.trangThai === "TU_CHOI", "từ chối phiếu");

  console.log("5. Ngừng giao dịch NCC");
  await nhaCungCapService.doiTrangThai(dongA.maNCC, "NGUNG_GIAO_DICH", admin);
  await phaiLoi(() => khoService.lapPhieuNhap(String(dongA.maNCC), "", [d(hoangTuBe, 5, 40000)], staff), "maNCC", "ngừng giao dịch");
  await nhaCungCapService.doiTrangThai(dongA.maNCC, "DANG_GIAO_DICH", admin);
  kiemTra((await khoService.nhaCungCapDeChon()).some((n) => n.maNCC === dongA.maNCC), "giao dịch lại → chọn được");
  kiemTra((await khoService.tongQuan()).choDuyet.phieuNhap === 1, "tổng quan kho: 1 phiếu nhập chờ duyệt (của seed)");

  console.log(loi ? `\n✘ ${loi} kiểm tra thất bại` : "\n✔ Tất cả kiểm tra đạt");
  process.exitCode = loi ? 1 : 0;
}
main().finally(() => prisma.$disconnect());
