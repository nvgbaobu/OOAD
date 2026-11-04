import type { Metadata } from "next";
import Form from "next/form";
import { yeuCauDangNhap } from "@/lib/auth/dal";
import { posService } from "@/lib/services/posService";
import { tienVND } from "@/lib/dinhDang";
import FormHanhDong from "@/app/components/FormHanhDong";
import KhoiThanhToan from "./KhoiThanhToan";
import {
  themSach, capNhatSoLuong, chonKhachHang, boKhachHang, apMaGiamGia, boMaGiamGia, datDiemSuDung, huyDon,
} from "@/app/actions/pos";

export const metadata: Metadata = { title: "Bán hàng" };

const nutNho = "rounded border px-2 py-0.5 text-sm hover:bg-gray-100 disabled:opacity-40";
const oNhap = "rounded border px-2 py-1.5 text-sm";

export default async function TrangPOS({ searchParams }: PageProps<"/pos">) {
  const nd = await yeuCauDangNhap("ADMIN", "STAFF");
  const { q } = await searchParams;
  const tuKhoa = typeof q === "string" ? q.trim() : "";
  const [{ don, tien, canhBao, phuongThuc, giaTriMotDiem }, ketQua] = await Promise.all([
    posService.layGioHang(nd.maTK),
    posService.timSach(tuKhoa),
  ]);
  const kh = don?.khachHang;
  const coSach = !!don && don.chiTiets.length > 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_440px]">
      {/* ───── Tìm sách ───── */}
      <section className="rounded-lg border bg-white p-4">
        {/* next/form: tìm kiếm chuyển trang phía client, không tải lại cả trang (tránh mất click khi trang đang hydrate) */}
        <Form action="/pos" replace className="mb-3 flex gap-2">
          <input name="q" defaultValue={tuKhoa} autoFocus placeholder="Tìm theo tên sách, tác giả hoặc ISBN..." className={`${oNhap} flex-1`} />
          <button className="rounded bg-blue-600 px-4 text-sm text-white hover:bg-blue-700">Tìm</button>
        </Form>
        <table className="w-full text-sm">
          <thead className="border-b text-left text-gray-500">
            <tr>
              <th className="py-2">Sách</th>
              <th>Thể loại</th>
              <th className="text-right">Giá bán</th>
              <th className="text-right">Còn bán</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {ketQua.map((s) => {
              const conBan = s.soLuongTon - s.soLuongTamGiu;
              return (
                <tr key={s.maSach} className="border-b last:border-0">
                  <td className="py-2">
                    <div className="font-medium">{s.tenSach}</div>
                    <div className="text-xs text-gray-500">{s.tacGia} · ISBN {s.isbn} · Kệ {s.viTriKe ?? "—"}</div>
                  </td>
                  <td className="text-xs">{s.theLoai.tenTL}<br /><span className="text-gray-500">VAT {Number(s.theLoai.thueSuatVAT)}%</span></td>
                  <td className="text-right">{tienVND(s.giaBan)}</td>
                  <td className={`text-right ${conBan <= s.dinhMucToiThieu ? "font-semibold text-orange-600" : ""}`}>{conBan}</td>
                  <td className="pl-2 text-right">
                    <FormHanhDong action={themSach} className="flex flex-col items-end">
                      <input type="hidden" name="maSach" value={s.maSach} />
                      <button disabled={conBan <= 0} className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:bg-gray-300">
                        {conBan > 0 ? "+ Thêm" : "Hết hàng"}
                      </button>
                    </FormHanhDong>
                  </td>
                </tr>
              );
            })}
            {ketQua.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-gray-500">Không tìm thấy sách đang bán phù hợp</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {/* ───── Đơn hàng ───── */}
      <section className="space-y-3 rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Đơn hàng {don ? `#${don.maHD}` : "mới"}</h2>
          {don && (
            <FormHanhDong action={huyDon} xacNhan="Hủy đơn đang lập? Sách sẽ được trả lại kho.">
              <button className="text-sm text-red-600 hover:underline">Hủy đơn</button>
            </FormHanhDong>
          )}
        </div>

        {/* Giỏ */}
        {coSach ? (
          <ul className="divide-y">
            {don.chiTiets.map((c) => (
              <li key={c.maSach} className="py-2 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{c.sach.tenSach}</span>
                  <span className="whitespace-nowrap">{tienVND(c.thanhTien)}</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-gray-600">
                  <FormHanhDong action={capNhatSoLuong}>
                    <input type="hidden" name="maSach" value={c.maSach} />
                    <input type="hidden" name="soLuong" value={c.soLuong - 1} />
                    <button className={nutNho} aria-label="Giảm">−</button>
                  </FormHanhDong>
                  <span className="w-8 text-center">{c.soLuong}</span>
                  <FormHanhDong action={capNhatSoLuong} className="flex flex-wrap items-center gap-1">
                    <input type="hidden" name="maSach" value={c.maSach} />
                    <input type="hidden" name="soLuong" value={c.soLuong + 1} />
                    <button className={nutNho} aria-label="Tăng">+</button>
                  </FormHanhDong>
                  <span className="ml-1 text-xs">× {tienVND(c.donGiaBan)} · VAT {Number(c.thueSuatVAT)}%</span>
                  <FormHanhDong action={capNhatSoLuong} className="ml-auto">
                    <input type="hidden" name="maSach" value={c.maSach} />
                    <input type="hidden" name="soLuong" value={0} />
                    <button className="text-xs text-red-600 hover:underline">Xóa</button>
                  </FormHanhDong>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded border border-dashed py-6 text-center text-sm text-gray-500">Chưa có sách trong đơn</p>
        )}

        {/* Khách hàng */}
        <div className="border-t pt-3">
          <h3 className="mb-1 text-sm font-medium">Khách hàng</h3>
          {kh ? (
            <div className="flex items-start justify-between rounded bg-gray-50 p-2 text-sm">
              <div>
                <div className="font-medium">{kh.hoTen} · {kh.soDienThoai}</div>
                <div className="text-gray-600">
                  Hạng {kh.hangThanhVien.tenHang} (ưu đãi {Number(kh.hangThanhVien.phanTramUuDai)}%) · {kh.diemHienTai} điểm
                </div>
              </div>
              <FormHanhDong action={boKhachHang}>
                <button className="text-xs text-red-600 hover:underline">Bỏ</button>
              </FormHanhDong>
            </div>
          ) : (
            <FormHanhDong action={chonKhachHang} className="flex flex-wrap gap-2">
              <input name="soDienThoai" inputMode="numeric" placeholder="SĐT khách thành viên (bỏ trống nếu khách lẻ)" className={`${oNhap} flex-1`} />
              <button className={nutNho}>Chọn</button>
            </FormHanhDong>
          )}
        </div>

        {coSach && (
          <>
            {/* Mã giảm giá */}
            <div className="border-t pt-3">
              <h3 className="mb-1 text-sm font-medium">Mã giảm giá</h3>
              {don.maGiamGia ? (
                <div className="flex items-center justify-between rounded bg-gray-50 p-2 text-sm">
                  <span>
                    <b>{don.maGiamGia.maCode}</b> –{" "}
                    {don.maGiamGia.loaiGiam === "PHAN_TRAM" ? `${Number(don.maGiamGia.giaTriGiam)}%` : tienVND(don.maGiamGia.giaTriGiam)}
                  </span>
                  <FormHanhDong action={boMaGiamGia}>
                    <button className="text-xs text-red-600 hover:underline">Bỏ</button>
                  </FormHanhDong>
                </div>
              ) : (
                <FormHanhDong action={apMaGiamGia} className="flex flex-wrap gap-2">
                  <input name="maCode" placeholder="Nhập mã" className={`${oNhap} flex-1 uppercase`} />
                  <button className={nutNho}>Áp dụng</button>
                </FormHanhDong>
              )}
            </div>

            {/* Đổi điểm */}
            {kh && kh.diemHienTai > 0 && (
              <div className="border-t pt-3">
                <h3 className="mb-1 text-sm font-medium">Đổi điểm <span className="font-normal text-gray-500">(1 điểm = {tienVND(giaTriMotDiem)})</span></h3>
                <FormHanhDong action={datDiemSuDung} className="flex flex-wrap gap-2" key={don.diemSuDung}>
                  <input name="diem" type="number" min={0} max={kh.diemHienTai} defaultValue={don.diemSuDung || ""} placeholder={`Tối đa ${kh.diemHienTai}`} className={`${oNhap} flex-1`} />
                  <button className={nutNho}>Dùng điểm</button>
                </FormHanhDong>
              </div>
            )}

            {/* Tổng tiền */}
            {tien && (
              <div className="space-y-1 border-t pt-3 text-sm">
                {canhBao && <p className="rounded bg-yellow-50 p-2 text-yellow-800">⚠ {canhBao}. Mã/điểm tạm thời không được tính.</p>}
                <Dong nhan="Tạm tính" giaTri={tien.tamTinh} />
                {tien.giamHang > 0 && <Dong nhan={`Ưu đãi hạng ${kh?.hangThanhVien.tenHang}`} giaTri={-tien.giamHang} />}
                {tien.giamMa > 0 && <Dong nhan={`Mã ${don.maGiamGia?.maCode}`} giaTri={-tien.giamMa} />}
                {tien.giamDiem > 0 && <Dong nhan={`Đổi ${don.diemSuDung} điểm`} giaTri={-tien.giamDiem} />}
                <Dong nhan="VAT (tính sau giảm)" giaTri={tien.thueVAT} />
                <div className="flex justify-between border-t pt-2 text-lg font-bold">
                  <span>Tổng cộng</span><span>{tienVND(tien.tongTien)}</span>
                </div>
                {kh && <p className="text-right text-xs text-gray-500">Khách được cộng {tien.diemCong} điểm</p>}
              </div>
            )}

            {tien && !canhBao && <KhoiThanhToan tongTien={tien.tongTien} phuongThuc={phuongThuc} />}
          </>
        )}
      </section>
    </div>
  );
}

function Dong({ nhan, giaTri }: { nhan: string; giaTri: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{nhan}</span>
      <span className={giaTri < 0 ? "text-green-700" : ""}>{giaTri < 0 ? `−${tienVND(-giaTri)}` : tienVND(giaTri)}</span>
    </div>
  );
}
