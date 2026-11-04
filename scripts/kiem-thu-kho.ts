// Kiểm thử nghiệp vụ Kho (kiểm kê, xuất hủy) trên DB thật. Chạy: npm run test:kho (chạy xong tự seed lại)
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { LoiNghiepVu } from "../lib/loi";
import { khoService } from "../lib/services/khoService";
import { posService } from "../lib/services/posService";
import { sachRepository } from "../lib/repositories/sachRepository";

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
const ton = async (maSach: number) => (await prisma.sach.findUniqueOrThrow({ where: { maSach } })).soLuongTon;

async function main() {
  const admin = 1, staff = 2;
  const nhaGiaKim = await sach("9786042000006"); // tồn 60
  const rungNaUy = await sach("9786042000007"); // tồn 15
  const matBiec = await sach("9786042000001"); // đang nằm trong phiếu kiểm kê chờ duyệt của seed
  const d = (s: { maSach: number }, sl: number | string, lyDo = "") => ({ maSach: String(s.maSach), slThucTe: String(sl), soLuong: String(sl), lyDo });

  console.log("1. Lập phiếu kiểm kê");
  await phaiLoi(() => khoService.lapKiemKe("", [], staff), null, "ít nhất 1");
  await phaiLoi(() => khoService.lapKiemKe("", [d(nhaGiaKim, 58), d(nhaGiaKim, 58)], staff), null, "chỉ được có 1 dòng");
  await phaiLoi(() => khoService.lapKiemKe("", [d(nhaGiaKim, 58)], staff), `dong.${nhaGiaKim.maSach}`, "nhập lý do");
  await phaiLoi(() => khoService.lapKiemKe("", [d(nhaGiaKim, -1, "x")], staff), `dong.${nhaGiaKim.maSach}`, "≥ 0");
  await phaiLoi(() => khoService.lapKiemKe("", [d(matBiec, matBiec.soLuongTon)], staff), `dong.${matBiec.maSach}`, "chờ duyệt");
  const pkk = await khoService.lapKiemKe(" Kiểm kệ  A2 ", [d(nhaGiaKim, 58, "Thất lạc"), d(rungNaUy, 16, "Đếm sót lần trước")], staff);
  const pkkDb = (await khoService.layKiemKe(pkk.maPKK))!;
  kiemTra(pkkDb.trangThai === "CHO_DUYET" && pkkDb.ghiChu === "Kiểm kệ A2", "phiếu CHO_DUYET, chuẩn hóa ghi chú");
  kiemTra(pkkDb.chiTiets.find((c) => c.maSach === nhaGiaKim.maSach)?.slHeThong === 60, "slHeThong = tồn lúc lập");
  kiemTra((await ton(nhaGiaKim.maSach)) === 60, "lập phiếu chưa đổi tồn kho");
  await phaiLoi(() => khoService.lapKiemKe("", [d(nhaGiaKim, 60)], admin), `dong.${nhaGiaKim.maSach}`, `#${pkk.maPKK}`);

  console.log("2. Duyệt kiểm kê (cộng chênh lệch vào tồn hiện tại)");
  await sachRepository.dieuChinhTon(prisma, nhaGiaKim.maSach, -5); // giả lập đã bán 5 cuốn sau khi lập phiếu
  await khoService.duyetKiemKe(pkk.maPKK, admin);
  kiemTra((await ton(nhaGiaKim.maSach)) === 53, `Nhà giả kim: 55 − 2 = 53 (${await ton(nhaGiaKim.maSach)})`);
  kiemTra((await ton(rungNaUy.maSach)) === 16, "Rừng Na Uy: 15 + 1 = 16");
  const daDuyet = (await khoService.layKiemKe(pkk.maPKK))!;
  kiemTra(daDuyet.trangThai === "DA_DUYET" && daDuyet.maTKDuyet === admin && !!daDuyet.ngayDuyet, "DA_DUYET, lưu người/ngày duyệt");
  await phaiLoi(() => khoService.duyetKiemKe(pkk.maPKK, admin), null, "đã được xử lý");
  kiemTra((await ton(nhaGiaKim.maSach)) === 53, "duyệt lần 2 không trừ thêm");

  console.log("3. Từ chối kiểm kê");
  const pkk2 = await khoService.lapKiemKe("", [d(nhaGiaKim, 50, "Nghi đếm sai")], staff);
  await phaiLoi(() => khoService.tuChoiKiemKe(pkk2.maPKK, "  ", admin), "lyDoTuChoi", "lý do");
  await khoService.tuChoiKiemKe(pkk2.maPKK, "Đếm lại", admin);
  const tuChoi = (await khoService.layKiemKe(pkk2.maPKK))!;
  kiemTra(tuChoi.trangThai === "TU_CHOI" && tuChoi.lyDoTuChoi === "Đếm lại", "TU_CHOI + lý do");
  kiemTra((await ton(nhaGiaKim.maSach)) === 53, "từ chối không đổi tồn");
  await phaiLoi(() => khoService.duyetKiemKe(pkk2.maPKK, admin), null, "đã được xử lý");

  console.log("4. Kiểm kê trừ vào phần đang tạm giữ");
  await posService.themSach(staff, rungNaUy.maSach, 16); // giữ hết 16 cuốn
  const pkk3 = await khoService.lapKiemKe("", [d(rungNaUy, 14, "Mất 2 cuốn")], admin);
  await phaiLoi(() => khoService.duyetKiemKe(pkk3.maPKK, admin), null, "Không trừ được");
  kiemTra((await khoService.layKiemKe(pkk3.maPKK))!.trangThai === "CHO_DUYET", "lỗi → rollback, phiếu vẫn chờ duyệt");
  await posService.huyDon(staff);
  await khoService.duyetKiemKe(pkk3.maPKK, admin);
  kiemTra((await ton(rungNaUy.maSach)) === 14, "hủy đơn giữ hàng rồi duyệt được: 16 − 2 = 14");

  console.log("5. Xuất hủy");
  await phaiLoi(() => khoService.lapXuatHuy("", [d(rungNaUy, 0, "x")], staff), `dong.${rungNaUy.maSach}`, "> 0");
  await phaiLoi(() => khoService.lapXuatHuy("", [d(rungNaUy, 2)], staff), `dong.${rungNaUy.maSach}`, "lý do");
  await phaiLoi(() => khoService.lapXuatHuy("", [d(rungNaUy, 15, "Ẩm")], staff), `dong.${rungNaUy.maSach}`, "Chỉ còn 14");
  await posService.themSach(staff, rungNaUy.maSach, 4);
  await phaiLoi(() => khoService.lapXuatHuy("", [d(rungNaUy, 11, "Ẩm")], staff), `dong.${rungNaUy.maSach}`, "4 đang tạm giữ");
  const pxh = await khoService.lapXuatHuy("Hư do mưa", [d(rungNaUy, 10, "Ẩm mốc"), d(nhaGiaKim, 3, "Rách bìa")], staff);
  kiemTra((await ton(rungNaUy.maSach)) === 14, "lập phiếu chưa trừ kho");
  await posService.themSach(staff, rungNaUy.maSach, 1); // còn bán 14 − 5 = 9 < 10
  await phaiLoi(() => khoService.duyetXuatHuy(pxh.maPXH, admin), null, "Không đủ");
  kiemTra((await ton(nhaGiaKim.maSach)) === 53 && (await khoService.layXuatHuy(pxh.maPXH))!.trangThai === "CHO_DUYET",
    "lỗi dòng 2 → rollback cả phiếu (Nhà giả kim không bị trừ)");
  await posService.huyDon(staff);
  await khoService.duyetXuatHuy(pxh.maPXH, admin);
  kiemTra((await ton(rungNaUy.maSach)) === 4 && (await ton(nhaGiaKim.maSach)) === 50, "duyệt: Rừng Na Uy 14 − 10 = 4, Nhà giả kim 53 − 3 = 50");
  await phaiLoi(() => khoService.tuChoiXuatHuy(pxh.maPXH, "abc", admin), null, "đã được xử lý");

  console.log("6. Tổng quan + nhật ký");
  const tq = await khoService.tongQuan();
  kiemTra(tq.sapHet.some((s) => s.maSach === rungNaUy.maSach) && tq.sapHet.every((s) => s.soLuongTon <= s.dinhMucToiThieu), "Rừng Na Uy (4) vào danh sách sắp hết");
  kiemTra(tq.choDuyet.kiemKe === 1 && tq.choDuyet.xuatHuy === 1, `chờ duyệt: ${tq.choDuyet.kiemKe} kiểm kê, ${tq.choDuyet.xuatHuy} xuất hủy (của seed)`);
  const nk = await prisma.nhatKyHeThong.findMany({ where: { module: "KHO" }, select: { hanhDong: true } });
  const dem = (h: string) => nk.filter((n) => n.hanhDong === h).length;
  kiemTra(dem("LAP_KIEM_KE") === 3 && dem("DUYET_KIEM_KE") === 2 && dem("TU_CHOI_KIEM_KE") === 1 && dem("LAP_XUAT_HUY") === 1 && dem("DUYET_XUAT_HUY") === 1,
    "nhật ký KHO đủ (lỗi rollback không ghi)");

  console.log(loi ? `\n✘ ${loi} kiểm tra thất bại` : "\n✔ Tất cả kiểm tra đạt");
  process.exitCode = loi ? 1 : 0;
}
main().finally(() => prisma.$disconnect());
