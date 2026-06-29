"use client";

import { useState, useEffect } from "react";
import TopNav from "@/components/layout/TopNav";
import { TrendingUp, TrendingDown, FileText, Users, BarChart2, AlertTriangle, Clock, Printer, XCircle, LogIn, Package } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatRupiah } from "@/lib/utils";
import { dashboardApi } from "@/lib/api";
import type { DashboardData } from "@/types";

// ── Mock fallback ─────────────────────────────────────────────────────────────
const mockData: DashboardData = {
  summary: {
    pendapatan_hari_ini: 24500000,
    pendapatan_kemarin: 22600000,
    persentase_perubahan_pendapatan: 8.4,
    profit_kotor: 5200000,
    profit_kemarin: 4990000,
    persentase_perubahan_profit: 4.2,
    volume_transaksi: 142,
    volume_transaksi_kemarin: 144,
    persentase_perubahan_volume: -1.2,
    jumlah_pelanggan: 84,
    jumlah_pelanggan_kemarin: 80,
    persentase_perubahan_pelanggan: 5.0,
  },
  peringatan_stok: [
    { sku: "SG-50-01", nama: "Semen Gresik 50kg", stok: 2, satuan: "Sak", status: "CRITICAL" },
    { sku: "BB-10-SNI", nama: "Besi Beton 10mm SNI", stok: 16, satuan: "Btg", status: "LOW" },
    { sku: "CT-DLX-W25", nama: "Cat Tembok Dulux Putih 25kg", stok: 0, satuan: "Klg", status: "EMPTY" },
  ],
  produk_terlaris: [
    { nama: "Semen Tiga Roda", unit_terjual: 420, total_nilai: 21000000 },
    { nama: "Besi Beton 10mm", unit_terjual: 315, total_nilai: 38000000 },
    { nama: "Paku Payung", unit_terjual: 150, total_nilai: 3000000 },
    { nama: "Triplek 9mm", unit_terjual: 88, total_nilai: 7000000 },
    { nama: "Cat Avitex Putih", unit_terjual: 54, total_nilai: 12000000 },
  ],
  aktivitas_terbaru: [
    { tipe: "INVOICE_PRINT", deskripsi: "Invoice #TRX-99824 dicetak", waktu: "" },
    { tipe: "STOCK_UPDATE", deskripsi: "Update stok Cat Tembok", waktu: "" },
    { tipe: "MEMBER_NEW", deskripsi: "Member VIP baru terdaftar", waktu: "" },
    { tipe: "TRX_CANCEL", deskripsi: "Pembatalan nota #TRX-99810", waktu: "" },
    { tipe: "LOGIN", deskripsi: "Kasir #2 mulai shift", waktu: "" },
  ],
  metode_pembayaran: {
    tunai: { persentase: 45, total: 11025000 },
    transfer_bank: { persentase: 40, total: 9800000 },
    qris: { persentase: 15, total: 3675000 },
    total_terproses: 24500000,
  },
  daily_sales_chart: [
    { hari: "Mon", nilai: 11000000 },
    { hari: "Tue", nilai: 18000000 },
    { hari: "Wed", nilai: 15000000 },
    { hari: "Thu", nilai: 25000000 },
    { hari: "Fri", nilai: 21000000 },
    { hari: "Sat", nilai: 30000000 },
    { hari: "Sun", nilai: 27000000 },
  ],
};

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
  const [data, setData] = useState<DashboardData>(mockData);
  const [loading, setLoading] = useState(true);
  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  useEffect(() => {
    const todayIso = new Date().toISOString().split("T")[0];
    dashboardApi.getOverview(todayIso)
      .then((res) => {
        const payload = res as Record<string, unknown>;
        const d = (payload.data ?? res) as Record<string, unknown>;
        if (!d || typeof d !== "object") return;

        // API mengembalikan data nested: d.summary, d.produk_terlaris, dll.
        const s   = (d.summary ?? {}) as Record<string, unknown>;
        const stockArr = d.peringatan_stok as unknown[] | undefined;
        const topArr   = d.produk_terlaris as unknown[] | undefined;
        const actArr   = d.aktivitas_terbaru as unknown[] | undefined;
        const chart    = d.daily_sales_chart as unknown[] | undefined;
        const pm       = (d.metode_pembayaran ?? {}) as Record<string, unknown>;
        const tunai    = (pm.tunai ?? {}) as Record<string, unknown>;
        const transfer = (pm.transfer_bank ?? {}) as Record<string, unknown>;
        const qris     = (pm.qris ?? {}) as Record<string, unknown>;

        setData((prev) => ({
          ...prev,
          summary: {
            pendapatan_hari_ini:              Number(s.pendapatan_hari_ini ?? prev.summary.pendapatan_hari_ini),
            pendapatan_kemarin:               Number(s.pendapatan_kemarin ?? 0),
            persentase_perubahan_pendapatan:  Number(s.persentase_perubahan_pendapatan ?? prev.summary.persentase_perubahan_pendapatan),
            profit_kotor:                     Number(s.profit_kotor ?? prev.summary.profit_kotor),
            profit_kemarin:                   Number(s.profit_kemarin ?? 0),
            persentase_perubahan_profit:      Number(s.persentase_perubahan_profit ?? prev.summary.persentase_perubahan_profit),
            volume_transaksi:                 Number(s.volume_transaksi ?? prev.summary.volume_transaksi),
            volume_transaksi_kemarin:         Number(s.volume_transaksi_kemarin ?? 0),
            persentase_perubahan_volume:      Number(s.persentase_perubahan_volume ?? prev.summary.persentase_perubahan_volume),
            jumlah_pelanggan:                 Number(s.jumlah_pelanggan ?? prev.summary.jumlah_pelanggan),
            jumlah_pelanggan_kemarin:         Number(s.jumlah_pelanggan_kemarin ?? 0),
            persentase_perubahan_pelanggan:   Number(s.persentase_perubahan_pelanggan ?? prev.summary.persentase_perubahan_pelanggan),
          },
          peringatan_stok: Array.isArray(stockArr) && stockArr.length > 0
            ? stockArr.map((item) => {
                const i = item as Record<string, unknown>;
                const stok = Number(i.stok ?? i.current_stock ?? 0);
                return {
                  sku: String(i.sku ?? i.sku_code ?? ""),
                  nama: String(i.nama ?? i.name ?? ""),
                  stok,
                  satuan: String(i.satuan ?? i.unit ?? "pcs"),
                  status: (stok === 0 ? "EMPTY" : stok <= 5 ? "CRITICAL" : "LOW") as "EMPTY" | "CRITICAL" | "LOW",
                };
              })
            : prev.peringatan_stok,
          produk_terlaris: Array.isArray(topArr) && topArr.length > 0
            ? topArr.map((item) => {
                const i = item as Record<string, unknown>;
                return {
                  nama:         String(i.nama ?? i.name ?? ""),
                  unit_terjual: Number(i.unit_terjual ?? i.quantity_sold ?? 0),
                  total_nilai:  Number(i.total_nilai ?? i.revenue ?? 0),
                };
              })
            : prev.produk_terlaris,
          aktivitas_terbaru: Array.isArray(actArr) && actArr.length > 0
            ? actArr.map((item) => {
                const i = item as Record<string, unknown>;
                return {
                  tipe:      String(i.tipe ?? i.type ?? "LOGIN"),
                  deskripsi: String(i.deskripsi ?? i.description ?? ""),
                  waktu:     String(i.waktu ?? i.created_at ?? ""),
                };
              })
            : prev.aktivitas_terbaru,
          metode_pembayaran: pm.total_terproses !== undefined ? {
            tunai:        { persentase: Number(tunai.persentase ?? 0),    total: Number(tunai.total ?? 0) },
            transfer_bank:{ persentase: Number(transfer.persentase ?? 0), total: Number(transfer.total ?? 0) },
            qris:         { persentase: Number(qris.persentase ?? 0),     total: Number(qris.total ?? 0) },
            total_terproses: Number(pm.total_terproses ?? 0),
          } : prev.metode_pembayaran,
          daily_sales_chart: Array.isArray(chart) && chart.length > 0
            ? chart.map((item) => {
                const i = item as Record<string, unknown>;
                return { hari: String(i.hari ?? ""), nilai: Number(i.nilai ?? 0) };
              })
            : prev.daily_sales_chart,
        }));
      })
      .catch(() => { /* keep mock data on error */ })
      .finally(() => setLoading(false));
  }, []);

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
              <h2 className="font-semibold text-gray-800">Daily Sales Performance</h2>
              <button className="text-gray-400 hover:text-gray-600"><BarChart2 size={16} /></button>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={daily_sales_chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="hari" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickFormatter={(v) => `${v / 1000000}jt`} />
                <Tooltip formatter={(v: number) => formatRupiah(v)} labelStyle={{ fontSize: 12 }} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Line type="monotone" dataKey="nilai" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4, fill: "#3B82F6" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
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
              { label: "Tunai", pct: metode_pembayaran.tunai.persentase, color: "bg-blue-600" },
              { label: "Transfer Bank", pct: metode_pembayaran.transfer_bank.persentase, color: "bg-gray-400" },
              { label: "QRIS / E-Wallet", pct: metode_pembayaran.qris.persentase, color: "bg-amber-400" },
            ].map((m) => (
              <div key={m.label} className="mb-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{m.label}</span>
                  <span className="font-semibold">{m.pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${m.color} rounded-full transition-all duration-500`} style={{ width: `${m.pct}%` }} />
                </div>
              </div>
            ))}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Terproses:</span>
                <span className="font-bold text-gray-900">{formatRupiah(metode_pembayaran.total_terproses)}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
