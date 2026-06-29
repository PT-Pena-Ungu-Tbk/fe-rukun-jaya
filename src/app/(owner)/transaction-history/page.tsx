"use client";

import { useState, useEffect, useCallback } from "react";
import TopNav from "@/components/layout/TopNav";
import { Download, RotateCcw, ExternalLink, Loader2 } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import Link from "next/link";
import { financeApi } from "@/lib/api";

function toDateStr(d: Date) { return d.toISOString().split("T")[0]; }
function firstOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function lastOfMonth(d: Date)  { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }

interface TopProduct {
  product_id: string;
  sku_code: string;
  name: string;
  quantity_sold: number;
  revenue: number;
}

export default function TransactionHistoryPage() {
  const now = new Date();
  const [dateFrom, setDateFrom] = useState(toDateStr(firstOfMonth(now)));
  const [dateTo,   setDateTo]   = useState(toDateStr(lastOfMonth(now)));
  const [loading,  setLoading]  = useState(false);

  const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [topProducts,  setTopProducts]  = useState<TopProduct[]>([]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await financeApi.getSummary({ date_from: dateFrom, date_to: dateTo });
      const payload = res as Record<string, unknown>;
      const d = (payload.data ?? payload) as Record<string, unknown>;
      setTotalRevenue(Number(d.total_revenue ?? 0));
      setSuccessCount(Number(d.successful_transactions ?? 0));
      setTopProducts((d.top_products ?? []) as TopProduct[]);
    } catch (_e) {
      // keep null
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopNav />
      <main className="flex-1 p-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Riwayat Transaksi</h2>
            <p className="text-sm text-gray-500">Ringkasan penjualan berdasarkan periode.</p>
          </div>
          <button className="btn-secondary text-sm"><Download size={14} /> Export CSV</button>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 mb-5 animate-slide-up">
          <div className="flex items-center gap-1.5 border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm text-gray-700">
            <span className="text-gray-400">📅</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="outline-none bg-transparent text-sm text-gray-700 w-32" />
            <span className="text-gray-400">–</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="outline-none bg-transparent text-sm text-gray-700 w-32" />
          </div>
          <button onClick={fetchReport} disabled={loading} className="btn-primary text-sm py-2">
            {loading ? <Loader2 size={14} className="animate-spin" /> : "Tampilkan"}
          </button>
          <button
            onClick={() => { setDateFrom(toDateStr(firstOfMonth(now))); setDateTo(toDateStr(lastOfMonth(now))); }}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-medium"
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-4 mb-5 animate-slide-up">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Total Revenue</p>
            {loading
              ? <div className="h-8 bg-gray-100 rounded animate-pulse w-32" />
              : <p className="text-2xl font-bold text-blue-600">{totalRevenue !== null ? formatRupiah(totalRevenue) : "-"}</p>
            }
            <p className="text-xs text-gray-400 mt-1">Periode terpilih</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Transaksi Berhasil</p>
            {loading
              ? <div className="h-8 bg-gray-100 rounded animate-pulse w-16" />
              : <p className="text-3xl font-bold text-gray-900">{successCount ?? "-"}</p>
            }
            <p className="text-xs text-gray-400 mt-1">Periode terpilih</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Produk Terlaris</p>
            {loading
              ? <div className="h-8 bg-gray-100 rounded animate-pulse w-24" />
              : <p className="text-base font-bold text-gray-900 truncate">{topProducts[0]?.name ?? "-"}</p>
            }
            {topProducts[0] && <p className="text-xs text-gray-400 mt-1">{topProducts[0].quantity_sold} terjual</p>}
          </div>
        </div>

        {/* Top Products Table */}
        <div className="flex gap-4 animate-slide-up stagger-2">
          <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Produk Terlaris</h3>
              <p className="text-xs text-gray-400 mt-0.5">Data dari <code className="bg-gray-100 px-1 rounded">GET /reports/financial</code></p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {["#", "SKU", "NAMA PRODUK", "QTY TERJUAL", "REVENUE"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading && (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    <Loader2 size={20} className="animate-spin inline mr-2" /> Memuat...
                  </td></tr>
                )}
                {!loading && topProducts.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-sm">
                    Tidak ada data pada periode ini.
                  </td></tr>
                )}
                {!loading && topProducts.map((p, idx) => (
                  <tr key={p.product_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.sku_code}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{p.quantity_sold} pcs</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatRupiah(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs text-gray-400">{topProducts.length} produk</span>
              <Link href="/financial-reports" className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium">
                Lihat Laporan Keuangan <ExternalLink size={10} />
              </Link>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
