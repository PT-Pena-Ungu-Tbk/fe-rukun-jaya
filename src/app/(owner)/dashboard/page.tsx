"use client";

import { useState, useEffect } from "react";
import TopNav from "@/components/layout/TopNav";
import { TrendingUp, TrendingDown, FileText, Users, BarChart2, AlertTriangle, Clock, Printer, XCircle, LogIn, Package, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const DashboardChart = dynamic(() => import("@/components/dashboard/DashboardChart"), {
  ssr: false,
  loading: () => <div className="w-full h-[220px] bg-gray-50 animate-pulse rounded-lg flex items-center justify-center text-sm text-gray-400">Memuat Grafik...</div>
});
import { formatRupiah } from "@/lib/utils";
import { dashboardApi } from "@/lib/api";
import type { DashboardData } from "@/types";

const activityIconMap: Record<string, React.ElementType> = {
  INVOICE_PRINT: Printer,
  STOCK_UPDATE: BarChart2,
  MEMBER_NEW: Users,
  TRX_CANCEL: XCircle,
  LOGIN: LogIn,
};

const colorMap: Record<string, string> = {
  INVOICE_PRINT: "bg-blue-100 text-blue-600",
  STOCK_UPDATE: "bg-green-100 text-green-600",
  MEMBER_NEW: "bg-purple-100 text-purple-600",
  TRX_CANCEL: "bg-red-100 text-red-600",
  LOGIN: "bg-gray-100 text-gray-600",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  useEffect(() => {
    setLoading(true);

    dashboardApi.getOverview()
      .then(setData)
      .catch((err) => {
        console.error("Gagal memuat dashboard:", err);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <TopNav />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-500">Memuat data dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <TopNav />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-700">Gagal memuat ringkasan dashboard</p>
            <p className="text-sm text-gray-400 mt-1">Silakan coba lagi beberapa saat lagi atau hubungi administrator.</p>
            <button onClick={() => {
              setLoading(true);
              dashboardApi.getOverview()
                .then(setData)
                .catch(() => setData(null))
                .finally(() => setLoading(false));
            }} className="btn-primary text-sm mt-4 inline-block">
              Muat Ulang
            </button>
          </div>
        </main>
      </div>
    );
  }

  const { summary, peringatan_stok, produk_terlaris, aktivitas_terbaru, metode_pembayaran, daily_sales_chart } = data;

  const statCards = [
    {
      label: "Pendapatan Hari Ini",
      value: formatRupiah(summary.pendapatan_hari_ini),
      change: summary.persentase_perubahan_pendapatan,
      icon: FileText,
    },
    {
      label: "Profit Kotor",
      value: formatRupiah(summary.profit_kotor),
      change: summary.persentase_perubahan_profit,
      icon: BarChart2,
    },
    {
      label: "Volume Transaksi",
      value: `${summary.volume_transaksi} Nota`,
      change: summary.persentase_perubahan_volume,
      icon: FileText,
    },
    {
      label: "Jumlah Pelanggan",
      value: `${summary.jumlah_pelanggan} Pelanggan`,
      change: summary.persentase_perubahan_pelanggan,
      icon: Users,
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopNav />
      <main className="flex-1 p-6 space-y-5 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tinjauan Operasional</h1>
            <p className="text-sm text-gray-500 mt-0.5">Ringkasan performa toko hari ini.</p>
          </div>
          <div className="flex items-center gap-2">
            {loading && (
              <span className="text-xs text-blue-500 animate-pulse">Memuat data…</span>
            )}
            <span className="text-sm text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
              {today}
            </span>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4 animate-slide-up">
          {statCards.map((s, i) => (
            <div key={i} className={`stat-card stagger-${i + 1}`}>
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{s.label}</p>
                <s.icon size={16} className="text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${s.change >= 0 ? "text-green-600" : "text-red-500"}`}>
                {s.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {s.change > 0 ? "+" : ""}{s.change}% vs kemarin
              </div>
            </div>
          ))}
        </div>

        {/* Chart + Stock Alerts */}
        <div className="grid grid-cols-3 gap-4 animate-slide-up stagger-2">
          {/* Chart */}
          <div className="col-span-2 page-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Performa Penjualan Harian</h2>
              <button className="text-gray-400 hover:text-gray-600"><BarChart2 size={16} /></button>
            </div>
            <DashboardChart data={daily_sales_chart} />
          </div>

          {/* Stock Alerts */}
          <div className="page-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className="text-amber-500" />
              <h2 className="font-semibold text-gray-800">Peringatan Stok Tipis</h2>
            </div>
            <div className="space-y-3">
              {peringatan_stok.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Semua stok aman</p>
              ) : peringatan_stok.map((s) => (
                <div key={s.sku} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800 leading-tight">{s.nama}</p>
                    <p className="text-xs text-gray-400">SKU: {s.sku}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                    s.status === "EMPTY" ? "bg-red-100 text-red-700" :
                    s.status === "CRITICAL" ? "bg-orange-100 text-orange-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {s.status === "EMPTY" ? "Habis!" : `Sisa ${s.stok} ${s.satuan}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-3 gap-4 animate-slide-up stagger-3">
          {/* Top Products */}
          <div className="page-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Produk Terlaris</h2>
              <Package size={15} className="text-gray-400" />
            </div>
            <div className="space-y-3">
              {produk_terlaris.map((p) => (
                <div key={p.nama} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.nama}</p>
                    <p className="text-xs text-gray-400">{p.unit_terjual} Unit Terjual</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {formatRupiah(p.total_nilai)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Activities */}
          <div className="page-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Aktivitas Terbaru</h2>
              <Clock size={15} className="text-gray-400" />
            </div>
            <div className="space-y-3">
              {aktivitas_terbaru.map((a, i) => {
                const Icon = activityIconMap[a.tipe] ?? FileText;
                const cls = colorMap[a.tipe] ?? "bg-gray-100 text-gray-600";
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${cls}`}>
                      <Icon size={13} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-700 leading-tight">{a.deskripsi}</p>
                      {a.waktu && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(a.waktu).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="page-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Metode Pembayaran</h2>
              <FileText size={15} className="text-gray-400" />
            </div>
            {[
              { label: "Tunai/Cash", pct: metode_pembayaran?.tunai?.persentase || 0, color: "bg-blue-600" },
            ].map((m) => (
              <div key={m.label} className="mb-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{m.label}</span>
                  <span className="font-semibold">{m.pct}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${m.color}`} style={{ width: `${m.pct}%` }}></div>
                </div>
              </div>
            ))}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Terproses:</span>
                <span className="font-bold text-gray-900">{formatRupiah(metode_pembayaran.tunai.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
