"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { inventoryApi } from "@/lib/api";
import StockBadge from "@/components/ui/StockBadge";
import { Search, Package, Loader2 } from "lucide-react";

export default function CheckStockPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["products", search],
    queryFn: () => inventoryApi.getProducts({ search }),
  });

  const products = data?.data ?? [];

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center px-6 py-4 bg-white border-b border-slate-200">
        <Package className="w-5 h-5 text-blue-600 mr-2" />
        <h2 className="text-lg font-bold text-slate-800">Check Stock</h2>
      </header>
      <div className="p-6">
        <div className="relative mb-4 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SKU or product name..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p className="text-sm">Memuat data produk...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <p className="text-sm">Tidak ada produk ditemukan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {products.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs font-mono text-slate-400">{p.sku_code}</p>
                  <StockBadge product={p} />
                </div>
                <p className="text-sm font-semibold text-slate-800 mb-1">{p.name}</p>
                <p className="text-xs text-slate-500 mb-3">{p.category} • {p.rack_location}</p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-slate-400">Current Stock</p>
                    <p className="text-2xl font-bold text-slate-800">{p.current_stock}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Min. Stock</p>
                    <p className="text-sm font-semibold text-slate-600">{p.min_stock}</p>
                  </div>
                </div>
                <div className="mt-2 w-full h-1.5 bg-slate-100 rounded-full">
                  <div
                    className={`h-1.5 rounded-full ${
                      p.current_stock === 0 ? "bg-red-500" :
                      p.current_stock <= p.min_stock ? "bg-amber-400" : "bg-green-500"
                    }`}
                    style={{
                      width: `${Math.min((p.current_stock / (p.min_stock * 3)) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
