"use client";

import { useState } from "react";
import TopNav from "@/components/layout/TopNav";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "@/lib/api";
import { mockProducts } from "@/lib/mockData";
import StockBadge from "@/components/ui/StockBadge";
import { formatRupiah } from "@/lib/utils";
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight, Package } from "lucide-react";
import toast from "react-hot-toast";
import type { CreateProductRequest } from "@/types";

const CATEGORIES = ["All", "Cement & Sand", "Steel", "Hardware", "Paints", "Timber", "Pipes & Fittings"];

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Partial<CreateProductRequest>>({});
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["products", search],
    queryFn: () => inventoryApi.getProducts({ search }),
  });

  const products = data?.data ?? mockProducts;
  const filtered = products.filter(
    (p) => category === "All" || p.category === category
  );

  const createMutation = useMutation({
    mutationFn: inventoryApi.createProduct,
    onSuccess: () => {
      toast.success("Produk berhasil ditambahkan!");
      qc.invalidateQueries({ queryKey: ["products"] });
      setShowModal(false);
      setForm({});
    },
    onError: () => toast.error("Gagal menambah produk."),
  });

  return (
    <div className="flex flex-col h-full">
      <TopNav
        title="Inventory Management"
        searchPlaceholder="Search SKU, Product..."
        onSearch={setSearch}
      />
      <div className="p-6 overflow-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Inventory Management</h2>
            <p className="text-sm text-slate-500">Kelola seluruh produk dan data master inventaris.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                category === c
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>SKU Code</th>
                <th>Category</th>
                <th>Supplier</th>
                <th>Buy Price</th>
                <th>Sell Price</th>
                <th>Stock</th>
                <th>Min</th>
                <th>Rack</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={11} className="text-center py-8 text-slate-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-8 text-slate-400">Tidak ada produk ditemukan.</td></tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="text-xs font-medium text-blue-600">{p.name}</td>
                    <td className="text-xs font-mono text-slate-500">{p.sku_code}</td>
                    <td className="text-xs text-slate-600">{p.category}</td>
                    <td className="text-xs text-slate-600">{p.supplier}</td>
                    <td className="text-xs text-slate-700">{formatRupiah(p.buy_price)}</td>
                    <td className="text-xs font-semibold text-slate-800">{formatRupiah(p.sell_price)}</td>
                    <td className="text-xs font-semibold">{p.current_stock.toLocaleString()}</td>
                    <td className="text-xs text-slate-500">{p.min_stock}</td>
                    <td className="text-xs text-slate-500">{p.rack_location}</td>
                    <td><StockBadge product={p} /></td>
                    <td>
                      <div className="flex gap-1">
                        <button className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-400">Showing {filtered.length} items</p>
            <div className="flex gap-1">
              <button className="p-1 hover:bg-slate-100 rounded"><ChevronLeft className="w-4 h-4 text-slate-400" /></button>
              <button className="p-1 hover:bg-slate-100 rounded"><ChevronRight className="w-4 h-4 text-slate-400" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <Package className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-800">Add New Product</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">SKU Code</label>
                <input value={form.sku_code ?? ""} onChange={(e) => setForm({ ...form, sku_code: e.target.value })} placeholder="SKU-XXX-001" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Product Name</label>
                <input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama produk" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Buy Price (Rp)</label>
                <input type="number" value={form.buy_price ?? ""} onChange={(e) => setForm({ ...form, buy_price: +e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sell Price (Rp)</label>
                <input type="number" value={form.sell_price ?? ""} onChange={(e) => setForm({ ...form, sell_price: +e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Initial Stock</label>
                <input type="number" value={form.current_stock ?? ""} onChange={(e) => setForm({ ...form, current_stock: +e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Min Stock</label>
                <input type="number" value={form.min_stock ?? ""} onChange={(e) => setForm({ ...form, min_stock: +e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Rack Location</label>
                <input value={form.rack_location ?? ""} onChange={(e) => setForm({ ...form, rack_location: e.target.value })} placeholder="R-A1-01" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setShowModal(false); setForm({}); }}
                className="flex-1 py-2.5 border border-slate-200 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={() => createMutation.mutate(form as CreateProductRequest)}
                disabled={createMutation.isPending}
                className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                {createMutation.isPending ? "Menyimpan..." : "Save Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
