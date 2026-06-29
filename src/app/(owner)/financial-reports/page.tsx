"use client";

import { useState, useEffect, useCallback } from "react";
import TopNav from "@/components/layout/TopNav";
import { Download, TrendingUp, Loader2 } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { financeApi } from "@/lib/api";

// Helpers
function toDateStr(d: Date) {
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}
function firstOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function lastOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

interface TopProduct {
  product_id: string;
  sku_code: string;
  name: string;
  quantity_sold: number;
  revenue: number;
}

export default function FinancialReportsPage() {
  const now = new Date();
  const [startDate, setStartDate] = useState(toDateStr(firstOfMonth(now)));
  const [endDate, setEndDate]     = useState(toDateStr(lastOfMonth(now)));
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(false);

  const [totalRevenue, setTotalRevenue]   = useState<number | null>(null);
  const [txCount, setTxCount]             = useState<number | null>(null);
  const [topProducts, setTopProducts]     = useState<TopProduct[]>([]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await financeApi.getSummary({ date_from: startDate, date_to: endDate });
      // res = { status, data: { total_revenue, total_profit, transaction_count, data: [...] } }
      // res = { status, data: { period, total_revenue, successful_transactions, top_products } }
      const payload = res as Record<string, unknown>;
      const d = (payload.data ?? payload) as Record<string, unknown>;

      setTotalRevenue(Number(d.total_revenue ?? 0));
      setTxCount(Number(d.successful_transactions ?? d.transaction_count ?? 0));
      setTopProducts((d.top_products ?? []) as TopProduct[]);
    } catch (_e) {
      // keep empty
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const filtered = topProducts.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku_code.includes(search)
  );

  const displayRevenue = totalRevenue ?? 0;
  const displayCount   = txCount ?? 0;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopNav />
      <main className="flex-1 p-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Laporan Keuangan</h1>
            <p className="text-sm text-gray-500 mt-0.5">Ringkasan performa finansial dan riwayat transaksi.</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Date range */}
            <label className="text-sm text-gray-500">Dari</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-input text-sm py-2 w-36"
            />
            <label className="text-sm text-gray-500">s/d</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-input text-sm py-2 w-36"
            />
            <button
              onClick={fetchReport}
              disabled={loading}
              className="btn-primary text-sm py-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : "Tampilkan"}
            </button>
            <button className="btn-secondary text-sm"><Download size={14} /> Unduh PDF</button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 mb-5 animate-slide-up">
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-sm">📊</span>
              </div>
              <p className="text-sm font-semibold text-gray-600">Total Omzet</p>
            </div>
            {loading ? (
              <div className="h-10 bg-gray-100 rounded animate-pulse" />
            ) : (
              <p className="text-3xl font-bold text-gray-900">{formatRupiah(displayRevenue)}</p>
            )}
            <div className="flex items-center gap-1 mt-2 text-green-600 text-sm font-medium">
              <TrendingUp size={15} /> Periode terpilih
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-sm">🧾</span>
              </div>
              <p className="text-sm font-semibold text-gray-600">Transaksi Berhasil</p>
            </div>
            {loading ? (
              <div className="h-10 bg-gray-100 rounded animate-pulse" />
            ) : (
              <p className="text-3xl font-bold text-gray-900">{displayCount}</p>
            )}
            <div className="flex items-center gap-1 mt-2 text-gray-400 text-sm">
              Periode terpilih
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="page-card animate-slide-up stagger-2">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Produk Terlaris</h3>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk / SKU..."
              className="form-input text-sm py-2 w-52"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>SKU</th>
                  <th>Nama Produk</th>
                  <th>Qty Terjual</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400">
                      <Loader2 size={20} className="animate-spin inline mr-2" /> Memuat data...
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                      Tidak ada data pada periode ini.
                    </td>
                  </tr>
                )}
                {!loading && filtered.map((p, idx) => (
                  <tr key={p.product_id} className="animate-fade-in">
                    <td className="text-gray-400 text-sm">{idx + 1}</td>
                    <td className="font-mono text-sm text-gray-600">{p.sku_code}</td>
                    <td className="font-medium text-gray-800">{p.name}</td>
                    <td className="text-gray-700">{p.quantity_sold} pcs</td>
                    <td className="font-semibold text-gray-900">{formatRupiah(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
            {filtered.length} produk
          </div>
        </div>
      </main>
    </div>
  );
}
