"use client";

import { useState, useEffect } from "react";
import TopNav from "@/components/layout/TopNav";
import Link from "next/link";
import { Save, Filter, RefreshCw, Loader2, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { inventoryApi } from "@/lib/api";

interface BulkItem {
  id: string;
  sku_code: string;
  nama_barang: string;
  stok_sistem: number;   // stok asli dari API
  stok_baru: number;     // stok yang akan di-update
  kode_rak: string;
}

export default function BulkUpdatePage() {
  const [items, setItems] = useState<BulkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await inventoryApi.getProducts();
      const products = res.data ?? [];
      setItems(products.map((p: Record<string, unknown>) => ({
        id: String(p.id),
        sku_code: String(p.sku_code ?? ""),
        nama_barang: String(p.name ?? ""),
        stok_sistem: Number(p.current_stock ?? 0),
        stok_baru: Number(p.current_stock ?? 0),
        kode_rak: String(p.rack_location ?? ""),
      })));
    } catch (_e) {
      toast.error("Gagal memuat produk");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const updateStok = (id: string, value: number) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, stok_baru: value } : i));
  };

  // Hanya item yang stok-nya berubah
  const changed = items.filter((i) => i.stok_baru !== i.stok_sistem);

  const handleSave = async () => {
    if (changed.length === 0) {
      toast("Tidak ada perubahan stok.", { icon: "ℹ️" });
      return;
    }
    setSaving(true);
    try {
      await inventoryApi.bulkUpdateStock(
        changed.map((i) => ({ id: i.id, new_stock: i.stok_baru }))
      );
      toast.success(`${changed.length} barang berhasil diupdate!`);
      // Sync stok_sistem ke stok_baru setelah save
      setItems((prev) => prev.map((i) => ({ ...i, stok_sistem: i.stok_baru })));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Gagal menyimpan perubahan");
    } finally {
      setSaving(false);
    }
  };

  const stokMenipis = items.filter((i) => i.stok_baru < 20).length;
  const selisihSignifikan = changed.filter(
    (i) => Math.abs(i.stok_baru - i.stok_sistem) / (i.stok_sistem || 1) > 0.1
  ).length;
  const now = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopNav />
      <main className="flex-1 p-6 animate-fade-in">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <ChevronRight size={14} />
          <Link href="/inventory" className="hover:text-blue-600">Inventory</Link>
          <ChevronRight size={14} />
          <span className="text-gray-800 font-medium">Perbarui Sekaligus</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Update Stok Massal</h1>
            <p className="text-sm text-gray-500 mt-0.5">Edit kolom "Stok Baru" lalu klik Simpan.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchProducts} disabled={loading} className="btn-secondary text-sm">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <button onClick={handleSave} disabled={saving || changed.length === 0} className="btn-primary text-sm">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Simpan {changed.length > 0 ? `(${changed.length} item)` : ""}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-5 animate-slide-up">
          {[
            { label: "Total Produk",       value: items.length,       color: "blue" },
            { label: "Ada Perubahan",       value: changed.length,     color: "blue" },
            { label: "Stok Menipis (<20)", value: stokMenipis,        color: "amber" },
            { label: "Selisih >10%",        value: selisihSignifikan,  color: "red" },
          ].map((s, i) => (
            <div key={i} className={`stat-card stagger-${i + 1}`}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color === "blue" ? "text-blue-600" : s.color === "amber" ? "text-amber-600" : "text-red-600"}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="page-card animate-slide-up stagger-2">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 text-sm text-gray-500">
            <span>{items.length} produk • terakhir refresh {now}</span>
            <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
              <Filter size={15} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Nama Barang</th>
                  <th>Stok Sistem</th>
                  <th>Stok Baru</th>
                  <th>Selisih</th>
                  <th>Kode Rak</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      <Loader2 size={20} className="animate-spin inline mr-2" /> Memuat...
                    </td>
                  </tr>
                )}
                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                      Tidak ada produk.
                    </td>
                  </tr>
                )}
                {!loading && items.map((item) => {
                  const selisih = item.stok_baru - item.stok_sistem;
                  const berubah = selisih !== 0;
                  return (
                    <tr key={item.id} className={`animate-fade-in ${berubah ? "bg-blue-50/40" : ""}`}>
                      <td className="font-mono text-xs text-gray-500">{item.sku_code}</td>
                      <td className="font-medium text-gray-800">{item.nama_barang}</td>
                      <td className="text-gray-500">{item.stok_sistem.toLocaleString("id-ID")}</td>
                      <td>
                        <input
                          type="number"
                          value={item.stok_baru}
                          min={0}
                          onChange={(e) => updateStok(item.id, +e.target.value)}
                          className={`w-24 px-2 py-1 text-sm font-bold border rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            berubah ? "border-blue-400 bg-white text-blue-800" : "border-gray-200"
                          }`}
                        />
                      </td>
                      <td>
                        {berubah && (
                          <span className={`text-xs font-semibold ${selisih > 0 ? "text-green-600" : "text-red-600"}`}>
                            {selisih > 0 ? "+" : ""}{selisih}
                          </span>
                        )}
                      </td>
                      <td className="text-gray-500 text-sm font-mono">{item.kode_rak}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-4 px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" /> Baris yang berubah
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" /> Tidak ada perubahan
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
