"use client";

import { useState } from "react";
import TopNav from "@/components/layout/TopNav";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "@/lib/api";
import { mockProducts } from "@/lib/mockData";
import { getStockStatus } from "@/types";
import StockBadge from "@/components/ui/StockBadge";
import { AlertTriangle, XCircle, TrendingDown, Truck, Package, Warehouse, Check, Download, Plus } from "lucide-react";
import toast from "react-hot-toast";

export default function StockAlertsPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["products", "low_stock"],
    queryFn: () => inventoryApi.getProducts({ low_stock: true }),
  });

  const products = data?.data ?? mockProducts;
  const lowStockItems = products.filter((p) => getStockStatus(p) !== "In Stock");
  const outOfStock = products.filter((p) => p.current_stock === 0);
  const belowMin = products.filter(
    (p) => p.current_stock > 0 && p.current_stock <= p.min_stock
  );

  const bulkMutation = useMutation({
    mutationFn: inventoryApi.bulkUpdateStock,
    onSuccess: () => {
      toast.success("Stok berhasil diperbarui!");
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => toast.error("Gagal update stok."),
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col h-full">
      <TopNav title="Stock Alerts & Replenishment" />
      <div className="p-6 overflow-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800">Stock Alerts & Replenishment</h2>
          <p className="text-sm text-slate-500">Monitor low stock and manage supplier orders.</p>
        </div>

        {/* Alert Banner */}
        {outOfStock.length > 0 && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">
                Action Required: {outOfStock.length + belowMin.length} items critically low on stock
              </p>
              <p className="text-xs text-red-500 mt-0.5">
                Immediate replenishment needed to avoid sales disruption. Review the items marked &apos;Out of Stock&apos; below.
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <p className="text-xs font-semibold text-slate-500 uppercase">Out of Stock (0 QTY)</p>
            </div>
            <p className="text-3xl font-bold text-red-600">{outOfStock.length}</p>
            <p className="text-xs text-slate-400 mt-1">Items</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown className="w-5 h-5 text-amber-500" />
              <p className="text-xs font-semibold text-slate-500 uppercase">Below Minimum</p>
            </div>
            <p className="text-3xl font-bold text-amber-600">{belowMin.length}</p>
            <p className="text-xs text-slate-400 mt-1">Items</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <Truck className="w-5 h-5 text-blue-500" />
              <p className="text-xs font-semibold text-slate-500 uppercase">Pending Orders</p>
            </div>
            <p className="text-3xl font-bold text-blue-600">3</p>
            <p className="text-xs text-slate-400 mt-1">Orders</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 mb-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 text-sm">Low Stock Inventory</h3>
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-xs font-medium text-slate-600 rounded-lg hover:bg-slate-50">
                <Download className="w-3.5 h-3.5" />
                Export Alert List
              </button>
              <button
                onClick={() => {
                  if (selected.length === 0) return;
                  bulkMutation.mutate(
                    selected.map((id) => {
                      const p = products.find((x) => x.id === id)!;
                      return { id, new_stock: p.min_stock * 3 };
                    })
                  );
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Bulk Update Stock
              </button>
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">
                  <input
                    type="checkbox"
                    checked={selected.length === lowStockItems.length && lowStockItems.length > 0}
                    onChange={() =>
                      setSelected(
                        selected.length === lowStockItems.length
                          ? []
                          : lowStockItems.map((p) => p.id)
                      )
                    }
                    className="rounded"
                  />
                </th>
                <th>SKU Code</th>
                <th>Product Name</th>
                <th>Current Stock</th>
                <th>Min. Threshold</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.map((p) => (
                <tr key={p.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="text-xs font-mono text-slate-600">{p.sku_code}</td>
                  <td className="text-xs font-medium text-slate-800">{p.name}</td>
                  <td className={`text-sm font-bold ${p.current_stock === 0 ? "text-red-600" : "text-amber-600"}`}>
                    {p.current_stock}
                  </td>
                  <td className="text-xs text-slate-500">{p.min_stock} units</td>
                  <td>
                    <StockBadge product={p} />
                  </td>
                  <td>
                    <button className="text-xs text-blue-600 hover:underline font-medium">
                      Restock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Replenishment Workflow */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
            Replenishment Workflow
          </p>
          <div className="flex items-center gap-3">
            {[
              { label: "Stock Alert Generated", icon: AlertTriangle, active: true },
              { label: "Bulk Update Initiated", icon: Package },
              { label: "Supplier Contacted", icon: Truck },
              { label: "Warehouse Restocked", icon: Warehouse },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-3">
                <div className={`flex flex-col items-center gap-1.5`}>
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      step.active
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] text-center text-slate-500 font-medium max-w-[70px]">
                    {step.label}
                  </span>
                </div>
                {i < 3 && (
                  <div className="flex-1 h-px bg-slate-200" style={{ minWidth: 32, marginBottom: 20 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
