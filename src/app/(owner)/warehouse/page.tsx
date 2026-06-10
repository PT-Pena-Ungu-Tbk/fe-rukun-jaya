"use client";

import TopNav from "@/components/layout/TopNav";
import { mockStorageZones, mockProducts } from "@/lib/mockData";
import { formatRupiah } from "@/lib/utils";
import { Warehouse, Zap, TrendingUp, ArrowDown, ArrowUp, RefreshCw } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const WORKFLOW = [
  { label: "Inbound Receiving", done: true },
  { label: "Quality Check", done: true },
  { label: "Put-away", active: true },
  { label: "Internal Transfer" },
  { label: "Outbound Picking" },
];

const STOCK_MOVEMENTS = [
  { sku: "CEM-50-HOL", name: "Holcim Portland Cement 50kg", zone: "Zone A / Floor", stock: "1,240", unit: "Sacks", movement: "down", time: "2h ago" },
  { sku: "STL-10-DEF", name: "Deformed Steel Rebar 10mm", zone: "Zone A / Rack A2", stock: "850", unit: "Pcs", movement: "up", time: "4h ago" },
  { sku: "PNT-25-DUL", name: "Dulux WeatherShield White 25L", zone: "Zone B / Rack B1", stock: "120", unit: "Pails", movement: "transfer", time: "1d ago" },
  { sku: "NAL-05-CON", name: "Concrete Nails 5cm", zone: "Zone C / Rack C4", stock: "45", unit: "Boxes", movement: "down", time: "2d ago" },
  { sku: "SND-BLK-01", name: "Washed Building Sand", zone: "Zone D / Yard 1", stock: "12.5", unit: "Trucks", movement: "up", time: "2d ago" },
];

export default function WarehousePage() {
  const capacityColor = (pct: number) => {
    if (pct >= 85) return "bg-red-500";
    if (pct >= 60) return "bg-amber-400";
    return "bg-blue-500";
  };

  return (
    <div className="flex flex-col h-full">
      <TopNav
        title="Warehouse Stock & Allocation"
        searchPlaceholder="Search products, SKUs, or zones..."
        showSearch
      />
      <div className="p-6 overflow-auto">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-800">Warehouse Stock & Allocation</h2>
          <p className="text-sm text-slate-500">
            Detailed view of storage zones, rack levels, and physical stock distribution.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Capacity", value: "85%", sub: "Full", icon: Warehouse, color: "text-blue-600" },
            { label: "Active Zones", value: "4", sub: "Zones A, B, C, D", icon: Zap, color: "text-blue-600" },
            { label: "High-Value Stock", value: "Rp 1.2B", sub: "Estimated Current Value", icon: TrendingUp, color: "text-blue-600" },
            { label: "Turnover Rate", value: "12.5x", sub: "+1.2x from last quarter", icon: RefreshCw, color: "text-blue-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs text-slate-500">{s.label}</p>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Operational Workflow */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Operational Workflow</h3>
          <div className="flex items-center gap-3">
            {WORKFLOW.map((step, i) => (
              <div key={step.label} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    step.done ? "bg-green-500 text-white" :
                    step.active ? "bg-blue-600 text-white" :
                    "bg-slate-100 text-slate-400"
                  }`}>
                    <Warehouse className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-center text-slate-500 max-w-[60px] font-medium">
                    {step.label}
                  </span>
                </div>
                {i < WORKFLOW.length - 1 && (
                  <div className="h-px bg-slate-200 w-8 mb-3.5" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Storage Zones */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Storage Zones Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            {mockStorageZones.map((zone) => (
              <div key={zone.name} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-slate-800">{zone.name}</h4>
                  {zone.status !== "Normal" && (
                    <Badge variant={zone.status === "High Utilization" ? "danger" : "warning"}>
                      {zone.status}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-3">{zone.description}</p>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-500">Capacity</span>
                  <span className={`text-sm font-bold ${
                    zone.capacity_percentage >= 85 ? "text-red-600" :
                    zone.capacity_percentage >= 60 ? "text-amber-600" : "text-blue-600"
                  }`}>
                    {zone.capacity_percentage}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full mb-2">
                  <div
                    className={cn("h-2 rounded-full", capacityColor(zone.capacity_percentage))}
                    style={{ width: `${zone.capacity_percentage}%` }}
                  />
                </div>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded">
                    {zone.rack_range}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded">
                    {zone.zone_type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Movements */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 text-sm">Recent Stock Distribution Movements</h3>
            <button className="text-xs text-blue-600 hover:underline">View All Movements</button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU Code</th>
                <th>Product Name</th>
                <th>Zone/Rack</th>
                <th>Current Stock</th>
                <th>Unit</th>
                <th>Last Movement</th>
              </tr>
            </thead>
            <tbody>
              {STOCK_MOVEMENTS.map((m) => (
                <tr key={m.sku}>
                  <td className="text-xs font-mono text-slate-500">{m.sku}</td>
                  <td className="text-xs text-slate-700">{m.name}</td>
                  <td>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded font-medium">
                      {m.zone}
                    </span>
                  </td>
                  <td className="text-xs font-semibold">{m.stock}</td>
                  <td className="text-xs text-slate-500">{m.unit}</td>
                  <td>
                    <div className="flex items-center gap-1 text-xs">
                      {m.movement === "down" && <ArrowDown className="w-3 h-3 text-red-500" />}
                      {m.movement === "up" && <ArrowUp className="w-3 h-3 text-green-500" />}
                      {m.movement === "transfer" && <RefreshCw className="w-3 h-3 text-blue-500" />}
                      <span className="text-slate-500">{
                        m.movement === "down" ? "Outbound " :
                        m.movement === "up" ? "Inbound " : "Transfer "
                      }{m.time}</span>
                    </div>
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
