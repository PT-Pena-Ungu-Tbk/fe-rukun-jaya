"use client";

import { useState } from "react";
import TopNav from "@/components/layout/TopNav";
import { Download, TrendingUp } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

const mockTransactions = [
  { id: "TRÚ-88291", tanggal: "24 Okt 2023, 14:30", pelanggan: "PT. Bangun Perkasa", metode: "Transfer Bank (BCA)", total: 45000000, status: "Sukses" },
  { id: "TRÚ-88290", tanggal: "24 Okt 2023, 11:15", pelanggan: "Toko Besi Maju Jaya", metode: "Giro", total: 12500000, status: "Sukses" },
  { id: "TRÚ-88289", tanggal: "23 Okt 2023, 09:45", pelanggan: "CV. Makmur Abadi", metode: "Transfer Bank (Mandiri)", total: 8750000, status: "Sukses" },
  { id: "TRÚ-88288", tanggal: "22 Okt 2023, 16:20", pelanggan: "Bpk. Budi Santoso", metode: "Tunai", total: 2100000, status: "Sukses" },
  { id: "TRÚ-88287", tanggal: "22 Okt 2023, 10:05", pelanggan: "PT. Konstruksi Indah", metode: "Transfer Bank (BRI)", total: 120000000, status: "Sukses" },
];

const periods = ["Bulan Ini (Okt 2023)", "Bulan Lalu", "Custom"];

export default function FinancialReportsPage() {
  const [period, setPeriod] = useState(periods[0]);
  const [search, setSearch] = useState("");

  const filtered = mockTransactions.filter((t) =>
    t.pelanggan.toLowerCase().includes(search.toLowerCase()) || t.id.includes(search)
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopNav />
      <main className="flex-1 p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Laporan Keuangan</h1>
            <p className="text-sm text-gray-500 mt-0.5">Ringkasan performa finansial dan riwayat transaksi.</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={period} onChange={(e) => setPeriod(e.target.value)}
              className="form-select text-sm py-2">
              {periods.map((p) => <option key={p}>{p}</option>)}
            </select>
            <button className="btn-secondary text-sm"><Download size={14} /> Unduh Laporan (PDF)</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5 animate-slide-up">
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-sm">📊</span>
              </div>
              <p className="text-sm font-semibold text-gray-600">Total Omzet</p>
            </div>
            <p className="text-4xl font-bold text-gray-900">{formatRupiah(1245000000)}</p>
            <div className="flex items-center gap-1 mt-2 text-green-600 text-sm font-medium">
              <TrendingUp size={15} /> +12.5% vs Bulan Lalu
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-sm">💰</span>
              </div>
              <p className="text-sm font-semibold text-gray-600">Keuntungan Bersih</p>
            </div>
            <p className="text-4xl font-bold text-gray-900">{formatRupiah(311250000)}</p>
            <div className="flex items-center gap-1 mt-2 text-green-600 text-sm font-medium">
              <TrendingUp size={15} /> +8.2% vs Bulan Lalu
            </div>
          </div>
        </div>

        <div className="page-card animate-slide-up stagger-2">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Riwayat Transaksi Sukses</h3>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari ID Transaksi..." className="form-input text-sm py-2 w-52" />
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID Transaksi</th><th>Tanggal & Waktu</th><th>Pelanggan</th>
                  <th>Metode Pembayaran</th><th>Total Transaksi</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="animate-fade-in">
                    <td className="font-mono text-sm font-semibold text-gray-700">{t.id}</td>
                    <td className="text-gray-600 text-sm">{t.tanggal}</td>
                    <td className="font-medium text-gray-800">{t.pelanggan}</td>
                    <td className="text-gray-600 text-sm">{t.metode}</td>
                    <td className="font-semibold text-gray-900">{formatRupiah(t.total)}</td>
                    <td><span className="badge-success">{t.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>Menampilkan 1-{filtered.length} dari 142 transaksi</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, "›"].map((p, i) => (
                <button key={i} className={`w-7 h-7 rounded text-xs ${p === 1 ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-600"}`}>{p}</button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
