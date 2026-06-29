"use client";

import { useState } from "react";
import TopNav from "@/components/layout/TopNav";
import { Download, Plus, RotateCcw, MoreVertical, ExternalLink, AlertTriangle } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import Link from "next/link";

const revenueData = [
  { date: "Oct 14", value: 18000000 },
  { date: "Oct 16", value: 28000000 },
  { date: "Oct 16b", value: 32000000 },
  { date: "Oct 18", value: 42000000 },
  { date: "Oct 18b", value: 36000000 },
  { date: "Oct 20", value: 52000000 },
  { date: "Oct 20b", value: 45000000 },
  { date: "Oct 22", value: 22000000 },
  { date: "Oct 22b", value: 38000000 },
  { date: "Today", value: 42500000, isToday: true },
];

const chartLabels = ["Oct 14", "", "Oct 16", "", "Oct 18", "", "Oct 20", "", "Oct 22", "Today"];

const mockTransactions = [
  { no: 1, id: "TRX-99824", isoDate: "2026-06-23", date: "23 Jun,", time: "14:32", customer: "PT. Maju Jaya", type: "VIP", cashier: "CSH-01", method: "Transfer", amount: 12500000, status: "Success" },
  { no: 2, id: "TRX-99823", isoDate: "2026-06-23", date: "23 Jun,", time: "13:15", customer: "Budi Santoso", type: "RETAIL", cashier: "CSH-02", method: "Credit", amount: 4200000, status: "Pending" },
  { no: 3, id: "TRX-99820", isoDate: "2026-06-23", date: "23 Jun,", time: "11:45", customer: "Toko Anugrah", type: "", cashier: "CSH-01", method: "Cash", amount: 850000, status: "Cancelled" },
  { no: 4, id: "TRX-99810", isoDate: "2026-06-22", date: "22 Jun,", time: "09:20", customer: "CV. Sentosa", type: "RETAIL", cashier: "CSH-01", method: "Cash", amount: 3200000, status: "Success" },
  { no: 5, id: "TRX-99801", isoDate: "2026-06-20", date: "20 Jun,", time: "15:10", customer: "PT. Bangun Jaya", type: "VIP", cashier: "CSH-02", method: "Transfer", amount: 28000000, status: "Success" },
];

const auditTrail = [
  { dot: "blue", time: "Just now", text: <><span className="font-bold">Owner</span> viewed TRX #99824</> },
  { dot: "gray", time: "14:35 (Today)", text: <>Receipt printed by <span className="font-bold">CSH-01</span></> },
  { dot: "red", time: "11:50 (Today)", text: <>TRX #99820 cancelled by <span className="font-bold text-blue-600">Owner</span></> },
];

const statusConfig: Record<string, { label: string; dot: string; badge: string }> = {
  Success:   { label: "Success",   dot: "bg-green-500",  badge: "bg-green-50 text-green-700 border border-green-200" },
  Pending:   { label: "Pending",   dot: "bg-amber-500",  badge: "bg-amber-50 text-amber-700 border border-amber-200" },
  Cancelled: { label: "Cancelled", dot: "bg-red-400",    badge: "bg-red-50 text-red-600 border border-red-200" },
};

export default function TransactionHistoryPage() {
  const [paymentFilter, setPaymentFilter] = useState("All Payment Methods");
  const [statusFilter, setStatusFilter] = useState("All");
  const [cashierFilter, setCashierFilter] = useState("All Cashiers");
  const [dateFrom, setDateFrom] = useState("2026-06-20");
  const [dateTo, setDateTo] = useState("2026-06-23");

  const filtered = mockTransactions.filter((t) => {
    const matchPayment = paymentFilter === "All Payment Methods" || t.method === paymentFilter;
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    const matchCashier = cashierFilter === "All Cashiers" || t.cashier === cashierFilter;
    const matchDate =
      (!dateFrom || t.isoDate >= dateFrom) &&
      (!dateTo   || t.isoDate <= dateTo);
    return matchPayment && matchStatus && matchCashier && matchDate;
  });

  const resetFilters = () => {
    setPaymentFilter("All Payment Methods");
    setStatusFilter("All");
    setCashierFilter("All Cashiers");
    setDateFrom("2026-06-20");
    setDateTo("2026-06-23");
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopNav />
      <main className="flex-1 p-6 animate-fade-in">
        {/* API Disclaimer Banner */}
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-800">Simulasi Riwayat Transaksi</h4>
            <p className="text-xs text-amber-700 mt-0.5">
              Data riwayat transaksi, diagram pendapatan, dan log audit transaksi di bawah ini adalah simulasi. Backend API belum menyediakan endpoint untuk riwayat transaksi lengkap <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-[11px]">GET /api/v1/transactions</code>.
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Overview</h2>
            <p className="text-sm text-gray-500">A snapshot of your store&apos;s financial performance.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary text-sm"><Download size={14} /> Export CSV</button>
            <button className="btn-primary text-sm"><Plus size={14} /> New Transaction</button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-4 mb-5 animate-slide-up">
          {/* Total Revenue */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-4 right-4 text-2xl opacity-60">💳</div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Total Revenue Today</p>
            <p className="text-2xl font-bold text-blue-600 mb-1">{formatRupiah(42500000)}</p>
            <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
              <span>↗</span> 4.5% vs yesterday
            </p>
          </div>
          {/* Total Trans */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Total Trans.</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">145</p>
            <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
              <span>↑</span> 12%
            </p>
          </div>
          {/* Pending */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Pending</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">3</p>
            <p className="text-xs text-amber-500 font-semibold">Require attention</p>
          </div>
        </div>

        {/* Revenue Trends Chart */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 shadow-sm animate-slide-up stagger-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Revenue Trends</h3>
            <button className="px-3 py-1 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50">Weekly</button>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={revenueData} barSize={28} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="0" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(v: number) => [formatRupiah(v), "Revenue"]}
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {revenueData.map((entry, i) => (
                  <Cell key={i} fill={(entry as any).isToday ? "#3b82f6" : "#bfdbfe"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-end">
            <span className="text-xs text-blue-600 font-semibold cursor-pointer hover:underline">Today</span>
          </div>
        </div>

        {/* Filter Row */}
        <div className="flex items-center gap-2 mb-3 animate-slide-up stagger-3">
          {/* Date Range */}
          <div className="flex items-center gap-1.5 border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm text-gray-700">
            <span className="text-gray-400">📅</span>
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
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}
            className="border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Payment Methods</option>
            <option>Cash</option><option>Transfer</option><option>Credit</option><option>QRIS</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="All">Status: All</option>
            <option>Success</option><option>Pending</option><option>Cancelled</option>
          </select>
          <select value={cashierFilter} onChange={(e) => setCashierFilter(e.target.value)}
            className="border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Cashiers</option>
            <option>CSH-01</option><option>CSH-02</option>
          </select>
          <button onClick={resetFilters}
            className="ml-auto flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-medium">
            <RotateCcw size={13} /> Reset Filters
          </button>
        </div>

        {/* Table + Audit Trail */}
        <div className="flex gap-4 animate-slide-up stagger-3">
          {/* Table */}
          <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {["NO.", "TRANSACTION ID", "DATE & TIME", "CUSTOMER", "CASHIER", "METHOD", "AMOUNT", "STATUS", "ACTIONS"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((t) => {
                  const cfg = statusConfig[t.status];
                  const isCancelled = t.status === "Cancelled";
                  return (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 text-sm text-gray-500">{t.no}</td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-semibold text-blue-600">#{t.id}</span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                        {t.date}<br />{t.time}
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-gray-800">{t.customer}</p>
                        {t.type && (
                          <span className={`text-[10px] font-bold uppercase tracking-wide ${t.type === "VIP" ? "text-amber-500" : "text-gray-400"}`}>
                            {t.type}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">{t.cashier}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{t.method}</td>
                      <td className="px-4 py-4">
                        <p className={`text-sm font-bold ${isCancelled ? "line-through text-gray-400" : "text-gray-900"}`}>
                          {formatRupiah(t.amount)}
                        </p>
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
                })}
              </tbody>
            </table>

            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
              <span>Showing 1 to 10 of 145</span>
              <div className="flex items-center gap-1">
                <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 text-xs">‹</button>
                {[1, 2, 3].map((p) => (
                  <button key={p} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium ${p === 1 ? "bg-blue-600 text-white" : "border border-gray-200 hover:bg-gray-50 text-gray-600"}`}>{p}</button>
                ))}
                <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 text-xs">›</button>
              </div>
            </div>
          </div>

          {/* Audit Trail Sidebar */}
          <div className="w-56 bg-white border border-gray-200 rounded-2xl shadow-sm p-4 flex-shrink-0 h-fit">
            <h4 className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-4">
              <RotateCcw size={14} className="text-gray-500" /> Audit Trail
            </h4>
            <div className="space-y-4">
              {auditTrail.map((a, i) => (
                <div key={i} className="flex gap-2.5">
                  <div className="flex flex-col items-center">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${a.dot === "blue" ? "bg-blue-500" : a.dot === "red" ? "bg-red-500" : "bg-gray-300"}`} />
                    {i < auditTrail.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1" />}
                  </div>
                  <div className="pb-2">
                    <p className="text-[10px] text-gray-400 mb-0.5">{a.time}</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{a.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/audit-log" className="flex items-center justify-center gap-1 text-xs text-blue-600 hover:underline font-medium mt-4 pt-3 border-t border-gray-100">
              View Full Audit Log <ExternalLink size={10} />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
