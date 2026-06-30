"use client";

import TopNav from "@/components/layout/TopNav";
import { formatRupiah } from "@/lib/utils";
import { Building, Package, ShoppingCart, Star, Plus, Check, ChevronRight, ChevronLeft, AlertTriangle } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { mockSuppliers } from "@/lib/mockData";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3 h-3 ${s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}`}
        />
      ))}
    </div>
  );
}

const topSuppliers = [
  { name: "Semen Indonesia", value: "Rp 1.2B" },
  { name: "Krakatau Steel", value: "Rp 850M" },
  { name: "Jati Indah Timber", value: "Rp 420M" },
  { name: "Avian Brands", value: "Rp 310M" },
];

export default function SupplierPage() {
  return (
    <div className="flex flex-col h-full">
      <TopNav title="Supplier Management" />
      <div className="p-6 overflow-auto">
        {/* API Disclaimer Banner */}
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-800">Simulasi Data Supplier</h4>
            <p className="text-xs text-amber-700 mt-0.5">
              Data supplier dan performa vendor di bawah ini adalah simulasi. Backend API belum menyediakan endpoint <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-[11px]">GET /api/v1/suppliers</code>.
            </p>
          </div>
        </div>

        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-800">Supplier Management</h2>
          <p className="text-sm text-slate-500">Monitor procurement performance and manage vendor relationships.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Active Suppliers", value: "24", sub: "+2 this month", icon: Building, color: "text-blue-600" },
            { label: "Pending Orders", value: "5", sub: "Requires attention", icon: Package, color: "text-amber-600" },
            { label: "Monthly Procurement Spend", value: "Rp 450M", sub: "-12% vs last month", icon: ShoppingCart, color: "text-blue-600" },
            { label: "On-Time Delivery Rate", value: "94%", sub: "", icon: Check, color: "text-green-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              {s.sub && <p className="text-xs text-slate-400 mt-1">{s.sub}</p>}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Table */}
          <div className="col-span-2 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700">
                  <Plus className="w-3.5 h-3.5" />
                  Add New Supplier
                </button>
                <input placeholder="Search suppliers..." className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 w-40" />
                <select className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none">
                  <option>All Categories</option>
                  <option>Cement</option>
                  <option>Steel</option>
                  <option>Paint</option>
                  <option>Timber</option>
                </select>
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Supplier ID</th>
                  <th>Vendor Name</th>
                  <th>Category</th>
                  <th>Primary Contact</th>
                  <th>Status</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {mockSuppliers.map((s) => (
                  <tr key={s.id}>
                    <td className="text-xs font-mono text-slate-500">{s.supplier_id}</td>
                    <td className="text-xs font-medium text-slate-800">{s.vendor_name}</td>
                    <td className="text-xs text-slate-600">{s.category}</td>
                    <td>
                      <p className="text-xs text-slate-700">{s.primary_contact}</p>
                      <p className="text-[11px] text-slate-400">{s.phone}</p>
                    </td>
                    <td>
                      <Badge
                        variant={
                          s.status === "Active"
                            ? "success"
                            : s.status === "On Hold"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {s.status}
                      </Badge>
                    </td>
                    <td>
                      <StarRating rating={s.rating} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-400">Showing 1-4 of 24 suppliers</p>
              <div className="flex gap-1">
                <button className="p-1 hover:bg-slate-100 rounded"><ChevronLeft className="w-4 h-4 text-slate-400" /></button>
                <button className="p-1 hover:bg-slate-100 rounded"><ChevronRight className="w-4 h-4 text-slate-400" /></button>
              </div>
            </div>

            {/* Procurement Workflow */}
            <div className="px-5 py-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-3">
                Procurement Workflow (Order #PO-2023-11-004)
              </p>
              <div className="flex items-center gap-3">
                {[
                  { label: "Supplier Sourcing", done: true },
                  { label: "Contract Negotiation", done: true },
                  { label: "Purchase Order", done: true },
                  { label: "Goods Receipt", active: true },
                  { label: "Payment Settlement" },
                ].map((step, i) => (
                  <div key={step.label} className="flex items-center gap-2">
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step.done ? "bg-green-500 text-white" :
                        step.active ? "bg-blue-600 text-white" :
                          "bg-slate-100 text-slate-400"
                        }`}>
                        {step.done ? <Check className="w-4 h-4" /> : i + 1}
                      </div>
                      <span className="text-[9px] text-center text-slate-500 max-w-[52px] font-medium">
                        {step.label}
                      </span>
                    </div>
                    {i < 4 && <div className="h-px bg-slate-200 w-8 mb-3" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Suppliers */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800">Top Suppliers by Volume</h3>
              <span className="text-[11px] text-slate-400">Current Fiscal Year</span>
            </div>
            <div className="space-y-3">
              {topSuppliers.map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">{s.name}</span>
                  <span className="text-xs font-semibold text-slate-800">{s.value}</span>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 text-xs text-blue-600 hover:underline text-center">
              View Full Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
