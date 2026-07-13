"use client";

import { useEffect, useState } from "react";
import TopNav from "@/components/layout/TopNav";
import { Download, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { reportsApi, transactionsApi } from "@/lib/api";
import type { FinanceSummary } from "@/types";
import toast from "react-hot-toast";

const periods = ["Bulan Ini", "Bulan Lalu", "Kustom"];

export default function FinancialReportsPage() {
  const [period, setPeriod] = useState(periods[0]);
  const [search, setSearch] = useState("");
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    let apiPeriod: "this_month" | "last_month" | "custom" = "this_month";
    if (period === "Bulan Lalu") apiPeriod = "last_month";
    if (period === "Kustom") apiPeriod = "custom";

    setLoading(true);
    reportsApi.getFinancial({
      period: apiPeriod,
      start_date: apiPeriod === "custom" && dateFrom ? new Date(dateFrom).toISOString() : undefined,
      end_date: apiPeriod === "custom" && dateTo ? new Date(dateTo).toISOString() : undefined
    })
      .then((res) => setSummary(res.data as FinanceSummary))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [period, dateFrom, dateTo]);

  useEffect(() => {
    let apiPeriod: "this_month" | "last_month" | "custom" = "this_month";
    if (period === "Bulan Lalu") apiPeriod = "last_month";
    if (period === "Kustom") apiPeriod = "custom";

    let start = undefined;
    let end = undefined;
    if (apiPeriod === "custom" && dateFrom) start = new Date(dateFrom).toISOString();
    if (apiPeriod === "custom" && dateTo) end = new Date(dateTo).toISOString();
    if (apiPeriod === "this_month") {
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      end = now.toISOString();
    }
    if (apiPeriod === "last_month") {
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString();
    }

    transactionsApi.getAllTransactions({ startDate: start, endDate: end })
      .then((res) => setTransactions(res?.data || []))
      .catch((err) => console.error("Gagal memuat transaksi:", err));
  }, [period, dateFrom, dateTo]);

  const handleDownloadPdf = async () => {
    try {
      toast.loading("Mengunduh laporan PDF...", { id: "download-pdf" });

      let start = undefined;
      let end = undefined;
      if (period === "Bulan Ini") {
        const now = new Date();
        start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        end = now.toISOString();
      } else if (period === "Bulan Lalu") {
        const now = new Date();
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString();
      } else if (period === "Kustom") {
        if (!dateFrom || !dateTo) {
          toast.error("Pilih rentang tanggal terlebih dahulu", { id: "download-pdf" });
          return;
        }
        start = new Date(dateFrom).toISOString();
        end = new Date(dateTo).toISOString();
      }

      const response = await reportsApi.exportPdf({ date_from: start, date_to: end });
      const blob = new Blob([response], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Laporan_Keuangan_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Laporan PDF berhasil diunduh!", { id: "download-pdf" });
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengunduh laporan PDF", { id: "download-pdf" });
    }
  };

  const filtered = transactions.filter((t) => {
    const term = search.toLowerCase();
    return !search ||
      t.invoice_no.toLowerCase().includes(term) ||
      (t.member_name || "").toLowerCase().includes(term);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedTransactions = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
            {period === "Kustom" && (
              <div className="flex items-center gap-1.5 border border-gray-200 bg-white rounded-lg px-3 py-1.5 text-sm text-gray-700">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="outline-none bg-transparent text-sm text-gray-700 w-32"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="outline-none bg-transparent text-sm text-gray-700 w-32"
                />
              </div>
            )}
            <select value={period} onChange={(e) => setPeriod(e.target.value)}
              className="form-select text-sm py-2">
              {periods.map((p) => <option key={p}>{p}</option>)}
            </select>
            <button onClick={handleDownloadPdf} className="btn-secondary text-sm">
              <Download size={14} /> Unduh Laporan
            </button>
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
            {loading ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="animate-spin text-blue-600" size={20} />
                <span className="text-sm text-gray-400">Memuat...</span>
              </div>
            ) : (
              <>
                <p className="text-4xl font-bold text-gray-900">{formatRupiah(summary?.total_omzet ?? 0)}</p>
                <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${(summary?.persentase_omzet_vs_sebelumnya ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {(summary?.persentase_omzet_vs_sebelumnya ?? 0) >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                  {(summary?.persentase_omzet_vs_sebelumnya ?? 0) > 0 ? "+" : ""}{summary?.persentase_omzet_vs_sebelumnya ?? 0}% vs periode sebelumnya
                </div>
              </>
            )}
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-sm">💰</span>
              </div>
              <p className="text-sm font-semibold text-gray-600">Keuntungan Bersih</p>
            </div>
            {loading ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="animate-spin text-blue-600" size={20} />
                <span className="text-sm text-gray-400">Memuat...</span>
              </div>
            ) : (
              <>
                <p className="text-4xl font-bold text-gray-900">{formatRupiah(summary?.keuntungan_bersih ?? 0)}</p>
                <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${(summary?.persentase_profit_vs_sebelumnya ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {(summary?.persentase_profit_vs_sebelumnya ?? 0) >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                  {(summary?.persentase_profit_vs_sebelumnya ?? 0) > 0 ? "+" : ""}{summary?.persentase_profit_vs_sebelumnya ?? 0}% vs periode sebelumnya
                </div>
              </>
            )}
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
                  <th>Total Transaksi</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-sm text-gray-400">
                      Tidak ada transaksi ditemukan.
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((t) => {
                    const d = new Date(t.created_at);
                    const dateStr = isNaN(d.getTime()) ? "-" : d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
                    const timeStr = isNaN(d.getTime()) ? "-" : d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";
                    return (
                      <tr key={t.id} className="animate-fade-in">
                        <td className="font-mono text-sm font-semibold text-gray-700">#{t.invoice_no}</td>
                        <td className="text-gray-600 text-sm">{dateStr} {timeStr}</td>
                        <td className="font-medium text-gray-800">{t.member_name || "Pelanggan Umum"}</td>
                        <td className="font-semibold text-gray-900">{formatRupiah(Number(t.grand_total))}</td>
                        <td><span className="badge-success">Sukses</span></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>
              Menampilkan {filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, filtered.length)} dari {filtered.length} transaksi
            </span>
            <div className="flex items-center gap-1">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="w-7 h-7 rounded text-xs hover:bg-gray-100 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed">
                ‹
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let startPage = Math.max(1, currentPage - 2);
                if (startPage + 4 > totalPages) {
                  startPage = Math.max(1, totalPages - 4);
                }
                const p = startPage + i;
                return (
                  <button 
                    key={p} 
                    onClick={() => setCurrentPage(p)}
                    className={`w-7 h-7 rounded text-xs ${p === currentPage ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-600"}`}>
                    {p}
                  </button>
                );
              })}
              
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="w-7 h-7 rounded text-xs hover:bg-gray-100 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed">
                ›
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
