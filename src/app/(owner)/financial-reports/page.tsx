"use client";

import { useState, useEffect, useCallback } from "react";
import TopNav from "@/components/layout/TopNav";
import { TrendingUp, TrendingDown, Loader2, Download } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { financeApi } from "@/lib/api";

function toDateStr(d: Date) { return d.toISOString().split("T")[0]; }
function firstOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function lastOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }

interface FinanceSummary {
  total_omzet: number;
  keuntungan_bersih: number;
  persentase_omzet_vs_sebelumnya: number;
  persentase_profit_vs_sebelumnya: number;
  periode: { date_from: string; date_to: string };
}

export default function FinancialReportsPage() {
  const now = new Date();
  const [startDate, setStartDate] = useState(toDateStr(firstOfMonth(now)));
  const [endDate, setEndDate]     = useState(toDateStr(lastOfMonth(now)));
  const [loading, setLoading]         = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [summary, setSummary]         = useState<FinanceSummary | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await financeApi.getSummary({ date_from: startDate, date_to: endDate });
      const payload = res as Record<string, unknown>;
      const d = (payload.data ?? payload) as Record<string, unknown>;
      setSummary({
        total_omzet:                    Number(d.total_omzet ?? 0),
        keuntungan_bersih:              Number(d.keuntungan_bersih ?? 0),
        persentase_omzet_vs_sebelumnya: Number(d.persentase_omzet_vs_sebelumnya ?? 0),
        persentase_profit_vs_sebelumnya:Number(d.persentase_profit_vs_sebelumnya ?? 0),
        periode: (d.periode as { date_from: string; date_to: string }) ?? { date_from: startDate, date_to: endDate },
      });
    } catch {
      // keep empty
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleExportPdf = async () => {
    setDownloading(true);
    try {
      const blob = await financeApi.exportPdf({ date_from: startDate, date_to: endDate });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laporan-keuangan-${startDate}-sd-${endDate}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // keep silent
    } finally {
      setDownloading(false);
    }
  };

  const GrowthBadge = ({ value }: { value: number }) => {
    const isUp = value >= 0;
    return (
      <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${isUp ? "text-green-600" : "text-red-500"}`}>
        {isUp ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
        {isUp ? "+" : ""}{value}% vs periode sebelumnya
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopNav />
      <main className="flex-1 p-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Laporan Keuangan</h1>
            <p className="text-sm text-gray-500 mt-0.5">Ringkasan performa finansial toko.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Dari</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="form-input text-sm py-2 w-36" />
            <label className="text-sm text-gray-500">s/d</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="form-input text-sm py-2 w-36" />
            <button onClick={fetchReport} disabled={loading} className="btn-primary text-sm py-2">
              {loading ? <Loader2 size={14} className="animate-spin" /> : "Tampilkan"}
            </button>
            <button onClick={handleExportPdf} disabled={downloading} className="btn-secondary text-sm py-2">
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <><Download size={14} /> Unduh PDF</>}
            </button>
          </div>
        </div>

        {/* Periode label */}
        {summary && (
          <p className="text-xs text-gray-400 mb-4">
            Periode: {new Date(summary.periode.date_from).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} —{" "}
            {new Date(summary.periode.date_to).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 animate-slide-up">
          {/* Total Omzet */}
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
              <p className="text-3xl font-bold text-gray-900">{formatRupiah(summary?.total_omzet ?? 0)}</p>
            )}
            {!loading && summary && <GrowthBadge value={summary.persentase_omzet_vs_sebelumnya} />}
          </div>

          {/* Keuntungan Bersih */}
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-sm">💰</span>
              </div>
              <p className="text-sm font-semibold text-gray-600">Keuntungan Bersih</p>
            </div>
            {loading ? (
              <div className="h-10 bg-gray-100 rounded animate-pulse" />
            ) : (
              <p className="text-3xl font-bold text-gray-900">{formatRupiah(summary?.keuntungan_bersih ?? 0)}</p>
            )}
            {!loading && summary && <GrowthBadge value={summary.persentase_profit_vs_sebelumnya} />}
          </div>
        </div>

        {/* Info margin */}
        {!loading && summary && summary.total_omzet > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-600 animate-fade-in">
            <span className="font-semibold text-gray-800">Margin Bersih: </span>
            {((summary.keuntungan_bersih / summary.total_omzet) * 100).toFixed(1)}%
            <span className="text-gray-400 ml-3">
              ({formatRupiah(summary.keuntungan_bersih)} dari {formatRupiah(summary.total_omzet)})
            </span>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2 mt-4">
            <Loader2 size={20} className="animate-spin" /> Memuat laporan...
          </div>
        )}

        {!loading && !summary && (
          <div className="text-center py-16 text-gray-400 text-sm mt-4">
            Pilih periode dan klik Tampilkan untuk melihat laporan.
          </div>
        )}
      </main>
    </div>
  );
}
