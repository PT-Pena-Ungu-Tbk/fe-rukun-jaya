"use client";

import { useParams } from "next/navigation";
import TopNav from "@/components/layout/TopNav";
import Link from "next/link";
import { ChevronRight, Printer, Pencil, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

const mockProduct = {
  item_id: "INV-001",
  nama_barang: "Semen Tiga Roda 50kg (PPC)",
  sku: "SMT-001",
  kondisi: "Baru",
  kategori: "Material Bangunan",
  satuan: "Sak",
  berat: "50 kg",
  dimensi: "70 × 40 × 20 cm",
  supplier: "PT. Indocement Tunggal",
  exp_date: "2025-12-31",
  garansi: "6 Bulan (Kualitas Produk)",
  deskripsi: "Semen Portland Pozzolan Cement (PPC) cocok untuk konstruksi umum, tahan terhadap sulfat.",
  harga_beli: 55000,
  harga_jual: 65000,
  stok_total: 455,
  nilai_inventaris: 24975000,
  gambar: [],
  distribusi: [
    { lokasi: "Gudang Utama - Rak A1-22", stok: 420, min_stok: 50 },
    { lokasi: "Etalase Toko Depan", stok: 35, min_stok: 10 },
  ],
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const p = mockProduct;

  const margin = ((p.harga_jual - p.harga_beli) / p.harga_beli * 100).toFixed(1);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopNav />
      <main className="flex-1 p-6 animate-fade-in">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <ChevronRight size={14} />
          <Link href="/inventory" className="hover:text-blue-600">Inventaris</Link>
          <ChevronRight size={14} />
          <span className="text-gray-800 font-medium">{p.nama_barang}</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{p.nama_barang}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-sm text-blue-600 font-semibold">{p.sku}</span>
              <span className="text-gray-300">•</span>
              <span className="badge-success text-xs">{p.kondisi}</span>
              <span className="text-gray-300">•</span>
              <span className="text-sm text-gray-500">{p.kategori}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary text-sm"><Printer size={14} /> Print Label</button>
            <Link href={`/inventory/${id}/edit`} className="btn-secondary text-sm"><Pencil size={14} /> Edit Produk</Link>
            <button className="btn-primary text-sm"><Plus size={14} /> Tambah Stok</button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 animate-slide-up">
          {/* Left: Details */}
          <div className="col-span-2 space-y-4">
            {/* Image Gallery Placeholder */}
            <div className="page-card p-5">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide text-gray-500">Galeri Foto</h3>
              <div className="grid grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={`aspect-square rounded-xl border-2 border-dashed flex items-center justify-center text-gray-300 ${i === 0 ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-gray-50"}`}>
                    {i === 0 ? <span className="text-4xl">🏗️</span> : <Plus size={18} className="text-gray-300" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Details */}
            <div className="page-card p-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Detail Teknis</h3>
              <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                {[
                  ["Satuan", p.satuan], ["Berat", p.berat], ["Dimensi", p.dimensi],
                  ["Supplier", p.supplier], ["Masa Berlaku", p.exp_date], ["Garansi", p.garansi],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500">{k}</span>
                    <span className="text-sm font-medium text-gray-900 text-right">{v}</span>
                  </div>
                ))}
              </div>
              {p.deskripsi && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Deskripsi</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{p.deskripsi}</p>
                </div>
              )}
            </div>

            {/* Stock Distribution */}
            <div className="page-card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Distribusi Inventaris</h3>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Lokasi Penyimpanan</th>
                    <th>Stok Tersedia</th>
                    <th>Min. Stok</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {p.distribusi.map((d) => (
                    <tr key={d.lokasi} className="animate-fade-in">
                      <td className="font-medium text-gray-800">{d.lokasi}</td>
                      <td className="font-semibold text-gray-900">{d.stok.toLocaleString("id-ID")} {p.satuan}</td>
                      <td className="text-gray-500">{d.min_stok} {p.satuan}</td>
                      <td>
                        {d.stok < d.min_stok
                          ? <span className="badge-danger">Stok Menipis</span>
                          : <span className="badge-success">Tersedia</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Pricing + Summary */}
          <div className="space-y-4">
            {/* Pricing */}
            <div className="page-card p-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Harga & Margin</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Harga Beli</span>
                  <span className="text-sm font-semibold text-gray-900">{formatRupiah(p.harga_beli)}<span className="text-xs text-gray-400 font-normal">/{p.satuan}</span></span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Harga Jual</span>
                  <span className="text-sm font-bold text-blue-600">{formatRupiah(p.harga_jual)}<span className="text-xs text-gray-400 font-normal">/{p.satuan}</span></span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-600">Margin Keuntungan</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp size={14} className="text-green-500" />
                    <span className="text-sm font-bold text-green-600">{margin}%</span>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs text-blue-600 font-semibold mb-0.5">Nilai Inventaris Total</p>
                  <p className="text-lg font-bold text-blue-800">{formatRupiah(p.nilai_inventaris)}</p>
                  <p className="text-xs text-blue-500">{p.stok_total} {p.satuan} × {formatRupiah(p.harga_beli)}</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="page-card p-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Ringkasan Stok</h3>
              <div className="space-y-3">
                {[
                  { label: "Total Stok", value: `${p.stok_total} ${p.satuan}`, color: "text-gray-900" },
                  { label: "Distribusi Gudang", value: `${p.distribusi.length} Lokasi`, color: "text-gray-700" },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500">{s.label}</span>
                    <span className={`text-sm font-semibold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
