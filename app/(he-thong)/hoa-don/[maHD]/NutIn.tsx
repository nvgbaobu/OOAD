"use client";

export default function NutIn() {
  return (
    <button onClick={() => window.print()} className="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700">
      In hóa đơn
    </button>
  );
}
