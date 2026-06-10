"use client";

import { useState } from "react";
import { mockTransactions, mockAuditLogs } from "@/lib/mockData";
import { formatDate, timeAgo } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import { Download, Plus, ShoppingCart, TrendingUp, Clock, Activity } from "lucide-react";

export default function TransactionHistoryPage() {
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [methodFilter, setMethodFilter] = useState("All Methods");

  const statusVariant = (s: string): "success" | "warning" | "danger" => {
    if (s === "Success") return "success";
    if (s === "Pending") return "warning";
    return "danger";
  };

  const auditColor = (action: string) => {
    if (action.includes("CANCEL")) return "text-red-500";
    if (action.includes("VIEW") || action.includes("REPRINT")) return "text-blue-500";
    return "text-slate-500";
  };

  const auditDot = (action: string) => {
    if (action.includes("CANCEL")) return "bg-red-500";
    if (action.includes("REPRINT")) return "bg-blue-400";
    if (action.includes("VIEW")) return "bg-blue-600";
    return "bg-green-500";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Transaction History</h2>
          <p className="text-xs text-slate-500">Review and audit all daily sales and financial movements.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-xs font-medium text-slate-600 rounded-lg hover:bg-slate-50">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700">
            <Plus className="w-3.5 h-3.5" />
            + New Transaction
          </button>
        </div>
      </header>

      <div className="p-6 overflow-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingCart className="w-4 h-4 text-blue-500" />
              <p className="text-xs text-slate-500 font-medium">Total Transactions</p>
            </div>
            <p className="text-2xl font-bold text-slate-800">145</p>
            <p className="text-xs text-green-500">↑ 12% vs yesterday</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <p className="text-xs text-slate-500 font-medium">Sales Volume Today</p>
            </div>
            <p className="text-2xl font-bold text-slate-800">Rp 42.500.000</p>
            <p className="text-xs text-green-500">↑ 4.0% vs yesterday</p>
          </div>
          <div className="bg-white rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-amber-500" />
              <p className="text-xs text-amber-600 font-medium">Pending Payments</p>
            </div>
            <p className="text-2xl font-bold text-amber-700">3</p>
            <p className="text-xs text-amber-500">Requires immediate action</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Main Table */}
          <div className="col-span-2 bg-white rounded-xl border border-slate-200">
            {/* Filters */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 cursor-pointer hover:bg-slate-50">
                <Clock className="w-3.5 h-3.5" />
                Oct.24, 2023 - Oct.24, 2023
              </div>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
              >
                <option>All Methods</option>
                <option>Cash</option>
                <option>Transfer</option>
                <option>Credit</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
              >
                <option>All Statuses</option>
                <option>Success</option>
                <option>Pending</option>
                <option>Cancelled</option>
              </select>
              <button className="text-xs text-blue-500 hover:underline">✕ Clear Filters</button>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Date & Time</th>
                  <th>Customer</th>
                  <th>Method</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockTransactions.map((t) => (
                  <tr key={t.id}>
                    <td className="text-xs text-blue-600 font-semibold">{t.invoice_no}</td>
                    <td>
                      <p className="text-xs text-slate-700">{formatDate(t.date)}</p>
                      <p className="text-[10px] text-slate-400">{t.cashier}</p>
                    </td>
                    <td>
                      <p className="text-xs text-slate-700">{t.customer}</p>
                      {t.customer_type === "VIP" && (
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[9px] font-bold rounded">VIP</span>
                      )}
                    </td>
                    <td className="text-xs text-slate-600">{t.method}</td>
                    <td className="text-xs font-semibold">
                      Rp {Number(t.total_amount).toLocaleString("id-ID")}
                    </td>
                    <td>
                      <Badge variant={statusVariant(t.status)}>{t.status}</Badge>
                    </td>
                    <td>
                      <button className="text-xs text-blue-500 hover:underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Audit Trail */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-800">Audit Trail Log</h3>
            </div>
            <div className="space-y-4">
              {mockAuditLogs.map((log) => (
                <div key={log.id} className="flex gap-2.5">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full mt-0.5 ${auditDot(log.action)}`} />
                    <div className="w-px flex-1 bg-slate-200 mt-1" />
                  </div>
                  <div className="pb-3">
                    <p className="text-[11px] text-slate-400 font-medium">
                      {log.id === mockAuditLogs[0].id ? "Just now" : timeAgo(log.created_at)}
                    </p>
                    <p className={`text-xs font-medium ${auditColor(log.action)}`}>
                      {log.user}{" "}
                      <span className="text-slate-600 font-normal">
                        {log.action.toLowerCase().replace(/_/g, " ")}{" "}
                      </span>
                      <span className="text-blue-600">#{log.record_id}</span>
                    </p>
                    {log.changes_payload.old_values?.reason && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Reason: {String(log.changes_payload.old_values.reason)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[11px] text-slate-400">09:15 (Today)</p>
                  <p className="text-xs text-slate-600">System batch sync completed successfully. 142 records updated.</p>
                </div>
              </div>
              <div className="flex gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[11px] text-slate-400">Yesterday 17:30</p>
                  <p className="text-xs text-slate-600">
                    Cashier 02 flagged <span className="text-blue-600">#TRX-99750</span> for manual review (Payment discrepancy).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
