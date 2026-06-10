"use client";

import { useState } from "react";
import TopNav from "@/components/layout/TopNav";
import { useQuery } from "@tanstack/react-query";
import { inventoryApi } from "@/lib/api";
import { mockProducts } from "@/lib/mockData";
import { formatRupiah } from "@/lib/utils";
import StockBadge from "@/components/ui/StockBadge";
import { getStockStatus } from "@/types";
import {
  Package,
  Layers,
  AlertTriangle,
  Building,
  Download,
  Plus,
  ChevronRight,
  ChevronLeft,
  Check,
  Truck,
  Boxes,
  BarChart2,
  RefreshCw,
} from "lucide-react";

const WORKFLOW_STEPS = [
  { label: "Supplier", icon: Truck },
  { label: "Warehouse", icon: Boxes },
  { label: "Inventory Setup", icon: Package, active: true },
  { label: "Stock Validation", icon: Check },
  { label: "Ready for Sales", icon: BarChart2 },
];

const RECENT_ACTIVITY = [
  { type: "update", text: "SKU-C-001 Rack location updated", by: "Owner", time: "10 minutes ago" },
  { type: "add", text: "Stock added: Cat Tembok Putih 25kg (50 pails)", by: "Warehouse Staff B", time: "2 hours ago" },
  { type: "create", text: "New product category created: Roofing Materials", by: "Owner", time: "Yesterday at 14:30" },
];

export default function DashboardPage() {
  const [search, setSearch] = useState("");
  const [currentPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["products", search],
    queryFn: () => inventoryApi.getProducts({ search }),
    // fall back to mock if API not available
  });

  const products = data?.data ?? mockProducts;
  const filtered = search
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku_code.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  const lowStockCount = products.filter(
    (p) => p.current_stock <= p.min_stock
  ).length;

  const topSuppliers = [
    { name: "PT Semen Indonesia", pct: 32 },
    { name: "Krakatau Steel Dist.", pct: 28 },
  ];

  return (
    <div className="flex flex-col h-full">
      <TopNav
        title="Toko Bangunan Ci Ailing — Inventory & Warehouse Setup"
        searchPlaceholder="Search SKU, Product..."
        onSearch={setSearch}
      />

      <div className="flex-1 p-6 overflow-auto">
        {/* Welcome Banner */}
        <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 mb-6 overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white">Welcome back, Owner</h2>
            <p className="text-blue-200 text-sm mt-1">Toko Bangunan Ci Ailing Dashboard</p>
          </div>
          <button className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors z-10">
            <Download className="w-4 h-4" />
            Export Report
          </button>
          <div className="absolute right-24 bottom-0 opacity-10">
            <Boxes className="w-32 h-32 text-white" />
          </div>
        </div>

        {/* Setup Workflow */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <p className="text-sm font-semibold text-slate-700 mb-4">Setup Workflow</p>
          <div className="flex items-center gap-2">
            {WORKFLOW_STEPS.map((step, i) => (
              <div key={step.label} className="flex items-center gap-2">
                <div
                  className={`flex flex-col items-center gap-1.5 ${
                    step.active ? "text-blue-600" : "text-slate-400"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      step.active ? "bg-blue-600 text-white" : "bg-slate-100"
                    }`}
                  >
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium">{step.label}</span>
                </div>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <div className="flex-1 h-px bg-slate-200 mx-1 mb-4" style={{ minWidth: 24 }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Products", value: "1,240", icon: Package, color: "text-blue-600" },
            { label: "Total Stock (Units)", value: "45,800", icon: Layers, color: "text-blue-600" },
            { label: "Low Stock Alerts", value: lowStockCount.toString(), icon: AlertTriangle, color: "text-amber-600", highlight: true },
            { label: "Active Suppliers", value: "24", icon: Building, color: "text-blue-600" },
          ].map((s) => (
            <div
              key={s.label}
              className={`bg-white rounded-xl border p-5 ${
                s.highlight ? "border-amber-200 bg-amber-50" : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-slate-500">{s.label}</p>
                <s.icon className={`w-4 h-4 ${s.highlight ? "text-amber-500" : s.color}`} />
              </div>
              <p className={`text-2xl font-bold ${s.highlight ? "text-amber-700" : "text-slate-800"}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-5">
          {/* Inventory Table */}
          <div className="col-span-2 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 text-sm">Inventory Management</h3>
              <div className="flex gap-2">
                <button className="text-slate-400 hover:text-slate-600 p-1">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU Code</th>
                  <th>Rack</th>
                  <th>Stock</th>
                  <th>Min</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      Loading...
                    </td>
                  </tr>
                ) : (
                  filtered.slice(0, 5).map((p) => (
                    <tr key={p.id}>
                      <td className="text-blue-600 font-medium text-xs">{p.name}</td>
                      <td className="text-xs text-slate-500">{p.sku_code}</td>
                      <td className="text-xs text-slate-600">{p.rack_location}</td>
                      <td className="text-xs font-semibold">{p.current_stock.toLocaleString()}</td>
                      <td className="text-xs text-slate-500">{p.min_stock}</td>
                      <td>
                        <StockBadge product={p} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-400">Showing 1-5 of 1,240 items</p>
              <div className="flex gap-1">
                <button className="p-1 hover:bg-slate-100 rounded">
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                </button>
                <button className="p-1 hover:bg-slate-100 rounded">
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            {/* Quick Add */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-800">Quick Add Product</h3>
              </div>
              <div className="space-y-3">
                <input placeholder="Product Name" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
                <div className="grid grid-cols-2 gap-2">
                  <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-400">
                    <option value="">Select...</option>
                    <option>Cement & Sand</option>
                    <option>Steel</option>
                    <option>Hardware</option>
                    <option>Paints</option>
                    <option>Timber</option>
                    <option>Pipes & Fittings</option>
                  </select>
                  <input placeholder="Rack Code" className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Initial Stock" type="number" className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  <input placeholder="Min Threshold" type="number" className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <input placeholder="Base Price (Rp)" type="number" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
                <button className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  Save Product
                </button>
              </div>
            </div>

            {/* Action Required */}
            <div className="bg-white rounded-xl border border-amber-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-semibold text-slate-800">Action Required</h3>
                </div>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                  12 Items
                </span>
              </div>
              {products
                .filter((p) => getStockStatus(p) !== "In Stock")
                .slice(0, 3)
                .map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="text-xs font-medium text-slate-700">{p.name}</p>
                      <p className="text-[11px] text-slate-400">{p.rack_location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-red-600">{p.current_stock} units</p>
                      <p className="text-[11px] text-slate-400">Min: {p.min_stock}</p>
                    </div>
                  </div>
                ))}
              <button className="w-full mt-3 text-xs text-blue-600 hover:underline">
                View all alerts
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity + Logistics */}
        <div className="grid grid-cols-2 gap-5 mt-5">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Recent Setup Activity</h3>
            <div className="space-y-3">
              {RECENT_ACTIVITY.map((a, i) => (
                <div key={i} className="flex gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    a.type === "add" ? "bg-green-100" : a.type === "create" ? "bg-blue-100" : "bg-slate-100"
                  }`}>
                    {a.type === "add" ? <Plus className="w-3.5 h-3.5 text-green-600" /> :
                     a.type === "create" ? <Package className="w-3.5 h-3.5 text-blue-600" /> :
                     <RefreshCw className="w-3.5 h-3.5 text-slate-500" />}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-700">{a.text}</p>
                    <p className="text-[11px] text-slate-400">By {a.by} • {a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Logistics Overview */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Logistics Overview</h3>
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Top Suppliers
              </p>
              {topSuppliers.map((s) => (
                <div key={s.name} className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600">{s.name}</span>
                    <span className="text-xs font-semibold text-slate-700">{s.pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full">
                    <div
                      className="h-1.5 bg-blue-500 rounded-full"
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Warehouse Capacity
              </p>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-600">Zone A (Heavy Materials) near max capacity.</span>
                <span className="text-xs font-semibold text-amber-600">75%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full">
                <div className="h-2 bg-amber-400 rounded-full" style={{ width: "75%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
