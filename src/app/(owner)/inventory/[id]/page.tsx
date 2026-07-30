"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import TopNav from "@/components/layout/TopNav";
import Link from "next/link";
import { ChevronRight, Printer, Pencil, Plus, TrendingUp, Loader2, X, Save } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import toast from "react-hot-toast";
import { inventoryApi } from "@/lib/api";
import type { Product } from "@/types";

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [addStockQty, setAddStockQty] = useState(10);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);

  const [form, setForm] = useState({
    name: "",
    sku_code: "",
    category_id: "",
    supplier_id: "",
    buy_price: 0,
    sell_price: 0,
    current_stock: 0,
    min_stock: 10,
    rack_location: "",
  });

  const fetchProductDetail = () => {
    if (!id || Array.isArray(id)) return;
    setLoading(true);
    inventoryApi.getProduct(id)
      .then((res) => setProduct(res.data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProductDetail();
    inventoryApi.getCategories()
      .then((res) => setCategories(res.data || []))
      .catch((err) => console.error("Gagal memuat kategori:", err));

    inventoryApi.getSuppliers()
      .then((res) => setSuppliers(res.data || []))
      .catch((err) => console.error("Gagal memuat supplier:", err));
  }, [id]);

  const handleOpenEdit = () => {
    if (!product) return;
    const matchedCat = categories.find((c) => c.name === product.category)?.id || product.category_id || "";
    const matchedSup = suppliers.find((s) => s.name === product.supplier)?.id || product.supplier_id || "";
    setForm({
      name: product.name,
      sku_code: product.sku_code,
      category_id: matchedCat,
      supplier_id: matchedSup,
      buy_price: Number(product.buy_price || 0),
      sell_price: Number(product.sell_price || 0),
      current_stock: product.current_stock,
      min_stock: product.min_stock,
      rack_location: product.rack_location || "",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!id || Array.isArray(id)) return;
    if (!form.name.trim() || !form.sku_code.trim()) {
      toast.error("Nama barang dan SKU wajib diisi");
      return;
    }
    setSaving(true);
    try {
      await inventoryApi.updateProduct(id, {
        name: form.name,
        sku_code: form.sku_code,
        category_id: form.category_id || undefined,
        supplier_id: form.supplier_id || undefined,
        buy_price: form.buy_price,
        sell_price: form.sell_price,
        current_stock: form.current_stock,
        min_stock: form.min_stock,
        rack_location: form.rack_location,
      });
      toast.success("Produk berhasil diperbarui!");
      setShowEditModal(false);
      fetchProductDetail();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Gagal memperbarui produk");
    } finally {
      setSaving(false);
    }
  };

  const handleAddStock = async () => {
    if (!id || Array.isArray(id) || !product) return;
    if (addStockQty <= 0) {
      toast.error("Jumlah tambahan stok harus lebih dari 0");
      return;
    }
    setSaving(true);
    try {
      await inventoryApi.updateProduct(id, {
        current_stock: product.current_stock + addStockQty,
      });
      toast.success(`Berhasil menambahkan ${addStockQty} unit stok!`);
      setShowAddStockModal(false);
      fetchProductDetail();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Gagal menambah stok");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <TopNav />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-500">Memuat detail produk...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <TopNav />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-700">Produk tidak ditemukan</p>
            <p className="text-sm text-gray-400 mt-1">ID produk yang Anda cari tidak valid atau telah dihapus.</p>
            <Link href="/inventory" className="btn-primary text-sm mt-4 inline-block">
              Kembali ke Inventaris
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const p = {
    item_id: product.id,
    nama_barang: product.name,
    sku: product.sku_code,
    kondisi: product.defective_stock > 0 ? "Rusak Ringan" : "Baru",
    kategori: product.category ?? product.category_id ?? "-",
    satuan: "Unit",
    supplier: product.supplier ?? product.supplier_id ?? "-",
    harga_beli: Number(product.buy_price),
    harga_jual: Number(product.sell_price),
    stok_total: product.current_stock,
    nilai_inventaris: product.current_stock * Number(product.buy_price),
    distribusi: [
      { lokasi: product.rack_location || "Gudang Utama", stok: product.current_stock, min_stok: product.min_stock },
    ],
  };

  const margin = p.harga_beli > 0 ? (((p.harga_jual - p.harga_beli) / p.harga_beli) * 100).toFixed(1) : "0.0";

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopNav />
      <main className="flex-1 p-6 animate-fade-in">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <ChevronRight size={14} />
          <Link href="/inventory" className="hover:text-blue-600">Inventaris</Link>
          <ChevronRight size={14} />
          <span className="text-gray-800 font-medium">{p.nama_barang}</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{p.nama_barang}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-sm text-blue-600 font-semibold">{p.sku}</span>
              <span className="text-gray-300">•</span>
              <span className="badge-success text-xs">{p.kondisi}</span>
              <span className="text-gray-300">•</span>
              <span className="text-sm text-gray-500">{p.kategori}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="btn-secondary text-sm">
              <Printer size={14} /> Print Label
            </button>
            <button onClick={handleOpenEdit} className="btn-secondary text-sm">
              <Pencil size={14} /> Edit Produk
            </button>
            <button onClick={() => setShowAddStockModal(true)} className="btn-primary text-sm">
              <Plus size={14} /> Tambah Stok
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 animate-slide-up">
          {/* Left: Details */}
          <div className="col-span-2 space-y-4">
            {/* Galeri Foto */}
            <div className="page-card p-5">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide text-gray-500">Galeri Foto</h3>
              <div className="grid grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={`aspect-square rounded-xl border-2 border-dashed flex items-center justify-center text-gray-300 ${i === 0 ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-gray-50"}`}>
                    {i === 0 ? <span className="text-4xl">🏗️</span> : <Plus size={18} className="text-gray-300" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Informasi & Lokasi Barang */}
            <div className="page-card p-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Informasi & Lokasi Barang</h3>
              <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                {[
                  ["Kode SKU", p.sku],
                  ["Kategori", p.kategori],
                  ["Supplier", p.supplier],
                  ["Kode Rak / Lokasi", p.distribusi[0]?.lokasi || "-"],
                  ["Stok Minimum", `${p.distribusi[0]?.min_stok || 10} Unit`],
                  ["Stok Saat Ini", `${p.stok_total} Unit`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500">{k}</span>
                    <span className="text-sm font-medium text-gray-900 text-right">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stock Distribution */}
            <div className="page-card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Distribusi Inventaris</h3>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Lokasi Penyimpanan</th>
                    <th>Stok Tersedia</th>
                    <th>Min. Stok</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {p.distribusi.map((d) => (
                    <tr key={d.lokasi} className="animate-fade-in">
                      <td className="font-medium text-gray-800">{d.lokasi}</td>
                      <td className="font-semibold text-gray-900">{d.stok.toLocaleString("id-ID")} {p.satuan}</td>
                      <td className="text-gray-500">{d.min_stok} {p.satuan}</td>
                      <td>
                        {d.stok < d.min_stok
                          ? <span className="badge-danger">Stok Menipis</span>
                          : <span className="badge-success">Tersedia</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Pricing + Summary */}
          <div className="space-y-4">
            {/* Pricing */}
            <div className="page-card p-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Harga & Margin</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Harga Beli</span>
                  <span className="text-sm font-semibold text-gray-900">{formatRupiah(p.harga_beli)}<span className="text-xs text-gray-400 font-normal">/{p.satuan}</span></span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Harga Jual</span>
                  <span className="text-sm font-bold text-blue-600">{formatRupiah(p.harga_jual)}<span className="text-xs text-gray-400 font-normal">/{p.satuan}</span></span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-600">Margin Keuntungan</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp size={14} className="text-green-500" />
                    <span className="text-sm font-bold text-green-600">{margin}%</span>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs text-blue-600 font-semibold mb-0.5">Nilai Inventaris Total</p>
                  <p className="text-lg font-bold text-blue-800">{formatRupiah(p.nilai_inventaris)}</p>
                  <p className="text-xs text-blue-500">{p.stok_total} {p.satuan} × {formatRupiah(p.harga_beli)}</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="page-card p-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Ringkasan Stok</h3>
              <div className="space-y-3">
                {[
                  { label: "Total Stok", value: `${p.stok_total} ${p.satuan}`, color: "text-gray-900" },
                  { label: "Distribusi Gudang", value: `${p.distribusi.length} Lokasi`, color: "text-gray-700" },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500">{s.label}</span>
                    <span className={`text-sm font-semibold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Product Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 modal-overlay p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl modal-content">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Edit Produk</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">Informasi Dasar</p>
                <div className="space-y-3">
                  <div>
                    <label className="form-label">Nama Barang *</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Nama produk" className="form-input" />
                  </div>
                  <div>
                    <label className="form-label">SKU *</label>
                    <input value={form.sku_code} onChange={(e) => setForm({ ...form, sku_code: e.target.value })}
                      placeholder="SKU" className="form-input font-mono" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Kategori *</label>
                      <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                        className="form-select text-sm w-full">
                        <option value="">Pilih Kategori</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="form-label mb-0">Supplier *</label>
                        <Link href="/supplier" target="_blank" className="text-[11px] text-blue-600 hover:underline">
                          + Kelola Supplier
                        </Link>
                      </div>
                      <select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                        className="form-select text-sm w-full">
                        <option value="">Pilih Supplier</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">Stok & Harga</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Jumlah Stok *</label>
                      <input type="number" value={form.current_stock} onChange={(e) => setForm({ ...form, current_stock: +e.target.value })}
                        className="form-input" min={0} />
                    </div>
                    <div>
                      <label className="form-label">Stok Minimum</label>
                      <input type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: +e.target.value })}
                        className="form-input" min={0} />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Kode Rak / Lokasi</label>
                    <input value={form.rack_location} onChange={(e) => setForm({ ...form, rack_location: e.target.value })}
                      placeholder="CONTOH: A1-01" className="form-input" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Harga Beli (Rp) *</label>
                      <input type="number" value={form.buy_price} onChange={(e) => setForm({ ...form, buy_price: +e.target.value })}
                        className="form-input" />
                    </div>
                    <div>
                      <label className="form-label">Harga Jual (Rp) *</label>
                      <input type="number" value={form.sell_price} onChange={(e) => setForm({ ...form, sell_price: +e.target.value })}
                        className="form-input" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowEditModal(false)} className="btn-secondary">Batal</button>
              <button onClick={handleSaveEdit} disabled={saving} className="btn-primary">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {showAddStockModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 modal-overlay p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl modal-content p-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">Tambah Stok Produk</h3>
            <p className="text-xs text-gray-500 mb-4">Tambahkan stok fisik untuk produk <strong>{p.nama_barang}</strong>.</p>
            <div className="mb-4">
              <label className="form-label">Jumlah Tambahan Stok (Unit) *</label>
              <input
                type="number"
                min={1}
                value={addStockQty}
                onChange={(e) => setAddStockQty(+e.target.value)}
                className="form-input"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddStockModal(false)} className="btn-secondary flex-1 justify-center">Batal</button>
              <button onClick={handleAddStock} disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Tambah
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
