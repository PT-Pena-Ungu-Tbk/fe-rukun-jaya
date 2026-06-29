"use client";

import { useState, useEffect } from "react";
import { inventoryApi } from "@/lib/api";
import { mockProducts } from "@/lib/mockData";
import StockBadge from "@/components/ui/StockBadge";
import { formatRupiah } from "@/lib/utils";
import { Search, Loader2 } from "lucide-react";
import type { Product } from "@/types";

export default function ProductSearchPage() {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await inventoryApi.getProducts({ search: search || undefined });
        const payload = res as Record<string, unknown>;
        const list: Product[] = (Array.isArray(payload.data) ? payload.data : Array.isArray(res) ? res : []) as Product[];
        if (list.length > 0) setProducts(list);
        else if (!search) setProducts(mockProducts);
        else setProducts([]);
      } catch {
        if (!search) setProducts(mockProducts);
      } finally {
        setIsLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center px-6 py-4 bg-white border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-800">Cari Produk</h2>
      </header>

      <div className="p-6">
        {/* Search bar */}
        <div className="relative mb-4 max-w-lg">
          {isLoading
            ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin" />
            : <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          }
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama produk, kode SKU, atau lokasi rak..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Produk</th>
                <th>Kode SKU</th>
                <th>Harga Jual</th>
                <th>Stok</th>
                <th>Rak</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    <Loader2 className="inline w-5 h-5 animate-spin mr-2" />
                    Mencari produk...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    Produk tidak ditemukan untuk &quot;{search}&quot;
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium text-slate-800">{p.name}</td>
                    <td className="font-mono text-xs text-slate-500">{p.sku_code}</td>
                    <td className="font-semibold text-blue-600">{formatRupiah(Number(p.sell_price))}</td>
                    <td className={`font-semibold ${p.current_stock === 0 ? "text-red-600" : p.current_stock <= p.min_stock ? "text-amber-600" : "text-slate-800"}`}>
                      {p.current_stock.toLocaleString("id-ID")}
                    </td>
                    <td className="text-slate-500 font-mono text-xs">{p.rack_location}</td>
                    <td><StockBadge product={p} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {!isLoading && products.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
              Menampilkan {products.length} produk
              {search && ` untuk pencarian "${search}"`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
