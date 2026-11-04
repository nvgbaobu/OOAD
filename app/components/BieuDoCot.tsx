// Biểu đồ cột 1 chuỗi (server component, HTML/CSS thuần – không cần thư viện).
// Quy ước (skill dataviz): 1 màu cho 1 chuỗi (tiêu đề nói rõ chuỗi là gì, không cần chú giải), cột mảnh bo đầu 4px
// neo đáy, khe 2px giữa các cột, lưới mờ; rê chuột vào cả cột (vùng bắt rộng hơn thanh) hiện tooltip giá trị.
type Cot = { nhan: string; giaTri: number; chuThich?: string };

function mocTron(max: number) {
  if (max <= 0) return 1;
  const buoc = 10 ** Math.floor(Math.log10(max));
  return Math.ceil(max / buoc) * buoc;
}

export default function BieuDoCot({ cot, dinhDang, cao = 180, nhanTruc }: {
  cot: Cot[]; dinhDang: (n: number) => string; cao?: number; nhanTruc?: (n: number) => string;
}) {
  const max = mocTron(Math.max(...cot.map((c) => c.giaTri), 0));
  const luoi = [1, 0.5, 0];
  const hienNhan = cot.length <= 12 ? 1 : Math.ceil(cot.length / 10); // thưa nhãn trục X khi nhiều cột

  return (
    <figure className="text-xs text-gray-500">
      <div className="flex gap-2">
        <div className="flex flex-col justify-between text-right" style={{ height: cao }} aria-hidden>
          {luoi.map((t) => <span key={t} className="-translate-y-1/2 leading-none">{(nhanTruc ?? dinhDang)(max * t)}</span>)}
        </div>
        <div className="relative flex-1">
          {luoi.map((t) => (
            <div key={t} className="absolute inset-x-0 border-t border-gray-200" style={{ top: (1 - t) * cao }} aria-hidden />
          ))}
          <ul className="relative flex items-end gap-[2px]" style={{ height: cao }} role="list">
            {cot.map((c) => (
              <li key={c.nhan} className="group relative flex h-full flex-1 items-end justify-center" aria-label={`${c.nhan}: ${dinhDang(c.giaTri)}`}>
                {/* Tooltip neo vào đỉnh thanh (không phải đỉnh cột) để không tràn ra ngoài khung biểu đồ */}
                <div className="relative w-full max-w-10 rounded-t-[4px] bg-blue-600 transition-colors group-hover:bg-blue-500"
                  style={{ height: c.giaTri > 0 ? Math.max(2, (c.giaTri / max) * cao) : 0 }}>
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded bg-gray-900 px-2 py-1 whitespace-nowrap text-white shadow group-hover:block">
                    <div className="font-medium">{c.nhan}</div>
                    <div>{dinhDang(c.giaTri)}</div>
                    {c.chuThich && <div className="text-gray-300">{c.chuThich}</div>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-1 flex gap-[2px]" aria-hidden>
            {cot.map((c, i) => <span key={c.nhan} className="flex-1 truncate text-center">{i % hienNhan === 0 ? c.nhan : ""}</span>)}
          </div>
        </div>
      </div>
    </figure>
  );
}
