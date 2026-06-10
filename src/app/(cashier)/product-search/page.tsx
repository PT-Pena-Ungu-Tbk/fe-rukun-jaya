"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { inventoryApi } from "@/lib/api";
import { mockProducts } from "@/lib/mockData";
import StockBadge from "@/components/ui/StockBadge";
import { formatRupiah } from "@/lib/utils";
import { Search } from "lucide-react";

export default function ProductSearchPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["products", search],
    queryFn: () => inventoryApi.getProducts({ search }),
  });

  const products = data?.data ?? mockProducts;

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center px-6 py-4 bg-white border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-800">Product Search</h2>
      </header>
      <div className="p-6">
        <div className="relative mb-4 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product name, SKU, or barcode..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>SKU Code</th>
                <th>Category</th>
                <th>Sell Price</th>
                <th>Stock</th>
                <th>Rack</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">Loading...</td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id}>
                    <td className="text-xs font-medium text-slate-800">{p.name}</td>
                    <td className="text-xs font-mono text-slate-500">{p.sku_code}</td>
                    <td className="text-xs text-slate-600">{p.category}</td>
                    <td className="text-xs font-semibold text-blue-600">{formatRupiah(p.sell_price)}</td>
                    <td className="text-xs font-semibold">{p.current_stock}</td>
                    <td className="text-xs text-slate-500">{p.rack_location}</td>
                    <td><StockBadge product={p} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
