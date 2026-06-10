"use client";

import { useState } from "react";
import TopNav from "@/components/layout/TopNav";
import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api";
import { mockSalesData, mockRevenueData, mockTransactions } from "@/lib/mockData";
import { formatRupiah, formatDate } from "@/lib/utils";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, ShoppingCart, DollarSign, Star,
  Download, Calendar, CheckCircle, Package, BarChart2, Truck,
} from "lucide-react";
import Badge from "@/components/ui/Badge";

const WORKFLOW = [
  { label: "Inventory Setup", icon: Package },
  { label: "Sales Transaction", icon: ShoppingCart },
  { label: "Stock Reduction", icon: TrendingUp },
  { label: "Financial Analysis", icon: BarChart2, active: true },
  { label: "Restocking", icon: Truck },
];

export default function FinancialReportsPage() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const lastDay = today.toISOString().split("T")[0];

  const { data } = useQuery({
    queryKey: ["reports", "financial"],
    queryFn: () => reportsApi.getFinancial({ start_date: firstDay, end_date: lastDay }),
  });

  const report = data?.data ?? {
    total_revenue: "1250000000.00",
    total_transactions: 3420,
    net_profit: "450000000.00",
    margin_percentage: "36.00",
    best_selling_product: "Semen Tiga Roda 50kg",
  };

  const statusVariant = (s: string) => {
    if (s === "Success") return "success";
    if (s === "Pending") return "warning";
    return "danger";
  };

  return (
    <div className="flex flex-col h-full">
      <TopNav title="Toko Bangunan Ci Ailing — Financial & Business Analytics" showSearch={false} />
      <div className="p-6 overflow-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Business Performance Overview</h2>
            <p className="text-sm text-slate-500">Comprehensive analysis of financial health and operational metrics.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600">
            <Calendar className="w-4 h-4" />
            This Month
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500 font-medium mb-2">Total Revenue</p>
            <p className="text-2xl font-bold text-slate-800">{formatRupiah(report.total_revenue)}</p>
            <p className="text-xs text-green-500 mt-1">↑ 12% vs last month</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500 font-medium mb-2">Total Transactions</p>
            <p className="text-2xl font-bold text-slate-800">{report.total_transactions.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">Completed orders</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500 font-medium mb-2">Net Profit</p>
            <p className="text-2xl font-bold text-slate-800">{formatRupiah(report.net_profit)}</p>
            <p className="text-xs text-green-500 mt-1">{report.margin_percentage}% margin</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500 font-medium mb-2">Best Selling Product</p>
            <p className="text-base font-bold text-slate-800">{report.best_selling_product}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <p className="text-xs text-slate-400">850 units sold</p>
            </div>
          </div>
        </div>

        {/* Workflow */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Operational Workflow Cycle</h3>
          <div className="flex items-center gap-3">
            {WORKFLOW.map((step, i) => (
              <div key={step.label} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    step.active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                  }`}>
                    <step.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-center text-slate-500 max-w-[60px] font-medium">{step.label}</span>
                </div>
                {i < WORKFLOW.length - 1 && <div className="h-px bg-slate-200 w-8 mb-3.5" />}
              </div>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-5 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800">Daily Sales Performance</h3>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={mockSalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800">Monthly Revenue Growth</h3>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={mockRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#334155" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transaction History Table */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 text-sm">Transaction History</h3>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700">
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
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
              </tr>
            </thead>
            <tbody>
              {mockTransactions.map((t) => (
                <tr key={t.id}>
                  <td className="text-xs text-blue-600 font-medium">{t.invoice_no}</td>
                  <td>
                    <p className="text-xs text-slate-700">{formatDate(t.date)}</p>
                    <p className="text-[11px] text-slate-400">{t.cashier}</p>
                  </td>
                  <td>
                    <p className="text-xs text-slate-700">{t.customer}</p>
                    {t.customer_type === "VIP" && (
                      <span className="text-[10px] text-blue-600 font-medium">VIP</span>
                    )}
                  </td>
                  <td className="text-xs text-slate-600">{t.method}</td>
                  <td className="text-xs font-semibold text-slate-800">
                    Rp {Number(t.total_amount).toLocaleString("id-ID")}
                  </td>
                  <td>
                    <Badge variant={statusVariant(t.status) as "success" | "warning" | "danger"}>
                      {t.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
