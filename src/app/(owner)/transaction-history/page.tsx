"use client";

import { useState, useEffect } from "react";
import TopNav from "@/components/layout/TopNav";
import { Download, Plus, RotateCcw, MoreVertical, Loader2 } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { transactionsApi } from "@/lib/api";
import apiClient from "@/lib/axios";
import toast from "react-hot-toast";

const getStatusConfig = (status: string) => {
  const normalized = status?.toUpperCase() || "SUCCESS";
  if (normalized === "SUCCESS" || normalized === "LUNAS" || normalized === "SUKSES") {
    return { label: "Sukses", dot: "bg-green-500", badge: "bg-green-50 text-green-700 border border-green-200" };
  }
  return { label: status, dot: "bg-gray-400", badge: "bg-gray-50 text-gray-600 border border-gray-200" };
};

export default function TransactionHistoryPage() {
  const [cashierFilter, setCashierFilter] = useState("Semua Kasir");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [rawTransactions, setRawTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchTransactions = () => {
    setLoading(true);
    setError(null);
    transactionsApi.getAllTransactions()
      .then((res) => {
        setRawTransactions(res?.data || []);
      })
      .catch((err) => {
        console.error(err);
        setError("Gagal memuat riwayat transaksi");
        setRawTransactions([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const resetFilters = () => {
    setCashierFilter("Semua Kasir");
    setDateFrom("");
    setDateTo("");
  };

  const cashiers = Array.from(new Set(rawTransactions.map(t => t.cashier_name).filter(Boolean)));

  const filteredTransactions = rawTransactions.filter((t) => {
    if (cashierFilter !== "Semua Kasir" && t.cashier_name !== cashierFilter) {
      return false;
    }
    if (dateFrom) {
      const d = new Date(t.created_at);
      const start = new Date(dateFrom);
      start.setHours(0, 0, 0, 0);
      if (d < start) return false;
    }
    if (dateTo) {
      const d = new Date(t.created_at);
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      if (d > end) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));
  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const mappedTransactions = paginatedTransactions.map((t, idx) => {
    const d = new Date(t.created_at);
    const dateStr = isNaN(d.getTime()) ? "-" : d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    const timeStr = isNaN(d.getTime()) ? "-" : d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";
    
    const itemsSummary = t.items && Array.isArray(t.items)
      ? t.items.map((item: any) => `${item.product_name} (${item.quantity}x)`).join(", ")
      : "-";

    return {
      no: idx + 1,
      id: t.id,
      invoice_no: t.invoice_no,
      dateTime: `${dateStr} ${timeStr}`,
      customer: t.member_name || "Pelanggan Umum",
      customerType: t.member_name ? "VIP" : "",
      cashier: t.cashier_name || "-",
      items: itemsSummary,
      amount: Number(t.grand_total || 0),
    };
  });

  const handleExportExcel = async () => {
    try {
      toast.loading("Mengunduh file Excel...", { id: "export-excel" });
      const response = await apiClient.get("/transactions/export/excel", {
        responseType: "blob",
        params: {
          startDate: dateFrom || undefined,
          endDate: dateTo || undefined,
        }
      });
      const blob = new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Export_Transaksi_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("File Excel berhasil diunduh!", { id: "export-excel" });
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengunduh file", { id: "export-excel" });
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopNav />
      <main className="flex-1 p-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Ringkasan</h2>
            <p className="text-sm text-gray-500">Gambaran umum performa keuangan toko Anda.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportExcel} className="btn-secondary text-sm">
              <Download size={14} /> Ekspor Excel
            </button>
          </div>
        </div>

        {/* Filter Row */}
        <div className="flex items-center gap-2 mb-3 animate-slide-up stagger-3">
          {/* Date Range */}
          <div className="flex items-center gap-1.5 border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm text-gray-700">
            <span className="text-gray-400"></span>
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
          <select value={cashierFilter} onChange={(e) => setCashierFilter(e.target.value)}
            className="border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="All Cashiers">Semua Kasir</option>
            {cashiers.map((cashier: any) => (
              <option key={cashier} value={cashier}>{cashier}</option>
            ))}
          </select>
          <button onClick={resetFilters}
            className="ml-auto flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-medium">
            <RotateCcw size={13} /> Atur Ulang Filter
          </button>
        </div>

        {/* Table */}
        <div className="flex gap-4 animate-slide-up stagger-3">
          <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["NO.", "NO. FAKTUR", "TANGGAL & WAKTU", "PELANGGAN", "KASIR", "BARANG", "TOTAL BELANJA", "STATUS", "AKSI"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="animate-spin text-blue-600" size={24} />
                        <span className="text-sm text-gray-500">Memuat riwayat transaksi...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-sm text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : mappedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-sm text-gray-400">
                      Belum ada riwayat transaksi.
                    </td>
                  </tr>
                ) : (
                  mappedTransactions.map((t) => {
                    const cfg = getStatusConfig("SUCCESS");
                    return (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 text-sm text-gray-500">{t.no}</td>
                        <td className="px-4 py-4">
                          <span className="text-sm font-semibold text-blue-600">#{t.invoice_no}</span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {t.dateTime}
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-medium text-gray-800">{t.customer}</p>
                          {t.customerType && (
                            <span className={`text-[10px] font-bold uppercase tracking-wide text-amber-500`}>
                              {t.customerType}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">{t.cashier}</td>
                        <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate" title={t.items}>{t.items}</td>
                        <td className="px-4 py-4 text-sm font-bold text-gray-900">
                          {formatRupiah(t.amount)}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
                            <MoreVertical size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>
              Menampilkan {filteredTransactions.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} dari {filteredTransactions.length} transaksi
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
        </div>
      </main>
    </div>
  );
}
