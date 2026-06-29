"use client";

import { useState, useEffect } from "react";
import TopNav from "@/components/layout/TopNav";
import { Plus, Pencil, Trash2, Ban, ChevronDown, X, Save, Loader2, AlertTriangle, RefreshCw, Search } from "lucide-react";
// ChevronDown reused as "trending down" icon for stat cards
import Link from "next/link";
import { formatRupiah } from "@/lib/utils";
import toast from "react-hot-toast";
import { inventoryApi } from "@/lib/api";
import type { Product } from "@/types";

type InventoryItem = Product & { _displayStok?: number; category_id?: string; supplier_id?: string };

const MOCK_ITEMS: InventoryItem[] = [
  { id: "INV-001", sku_code: "SMN-TR50", name: "Semen Tiga Roda 50kg", category: "Semen", supplier: "-", buy_price: "48000", sell_price: "55000", current_stock: 145, defective_stock: 0, min_stock: 30, rack_location: "A1-R01" },
  { id: "INV-089", sku_code: "PKB-5CM", name: "Paku Beton 5cm", category: "Paku", supplier: "-", buy_price: "12000", sell_price: "15000", current_stock: 0, defective_stock: 0, min_stock: 20, rack_location: "C3-R12" },
  { id: "INV-042", sku_code: "CAT-DLX5", name: "Cat Tembok Dulux Putih 5kg", category: "Cat", supplier: "-", buy_price: "115000", sell_price: "135000", current_stock: 24, defective_stock: 0, min_stock: 10, rack_location: "B2-R05" },
  { id: "INV-112", sku_code: "PPA-WAV12", name: "Pipa PVC Wavin 1/2\"", category: "Pipa", supplier: "-", buy_price: "22000", sell_price: "28000", current_stock: 18, defective_stock: 2, min_stock: 20, rack_location: "D1-R08" },
  { id: "INV-005", sku_code: "SMN-HLC40", name: "Semen Holcim 40kg", category: "Semen", supplier: "-", buy_price: "42000", sell_price: "49000", current_stock: 88, defective_stock: 0, min_stock: 30, rack_location: "A1-R02" },
  { id: "INV-215", sku_code: "PPA-WAV3", name: "Pipa PVC Wavin 3 Inch", category: "Pipa", supplier: "-", buy_price: "35000", sell_price: "45000", current_stock: 75, defective_stock: 0, min_stock: 20, rack_location: "B-12" },
];

const emptyForm = { sku_code: "", nama_barang: "", kategori: "", category_id: "", supplier_id: "", kondisi: "Baru" as const, jumlah_stok_awal: 0, min_stok: 10, satuan: "", kode_rak: "", harga_beli: 0, harga_jual: 0, tanggal_kadaluarsa: "" };

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(MOCK_ITEMS);
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("Semua Kategori");
  const [filterStatus, setFilterStatus] = useState("Semua Status");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<InventoryItem | null>(null);
  const [showEditModal, setShowEditModal] = useState<InventoryItem | null>(null);
  const [editForm, setEditForm] = useState({ name: "", sell_price: 0, buy_price: 0, current_stock: 0, rack_location: "" });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ stok_habis: 0, di_bawah_minimum: 0, akan_expired: 0 });
  const [categoryOptions, setCategoryOptions] = useState<{ id: string; label: string }[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    inventoryApi.getProducts()
      .then((res) => {
        const payload = res as Record<string, unknown>;
        const products: InventoryItem[] = (Array.isArray(payload.data) ? payload.data : Array.isArray(res) ? res : []) as InventoryItem[];
        if (products.length) setItems(products);

        // Extract unique category & supplier IDs dari produk existing
        const catMap = new Map<string, string>();
        const supMap = new Map<string, string>();
        products.forEach((p: InventoryItem) => {
          if (p.category_id && !catMap.has(p.category_id))
            catMap.set(p.category_id, `Kategori (${p.name})`);
          if (p.supplier_id && !supMap.has(p.supplier_id))
            supMap.set(p.supplier_id, `Supplier (${p.name})`);
        });
        setCategoryOptions(Array.from(catMap.entries()).map(([id, label]) => ({ id, label })));
        setSupplierOptions(Array.from(supMap.entries()).map(([id, label]) => ({ id, label })));
      })
      .catch(() => { /* keep mock data */ })
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.id.toLowerCase().includes(search.toLowerCase()) || item.sku_code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "Semua Status" ||
      (filterStatus === "Stok Habis" && item.current_stock === 0) ||
      (filterStatus === "Stok Rendah" && item.current_stock > 0 && item.current_stock <= item.min_stock) ||
      (filterStatus === "In Stock" && item.current_stock > item.min_stock);
    return matchSearch && matchStatus;
  });

  const localSummary = {
    stokHabis: summary.stok_habis || items.filter((i) => i.current_stock === 0).length,
    dibawahMin: summary.di_bawah_minimum || items.filter((i) => i.current_stock > 0 && i.current_stock <= i.min_stock).length,
    akanExpired: summary.akan_expired || 0,
  };

  const handleSave = async () => {
    if (!form.nama_barang) { toast.error("Nama barang wajib diisi"); return; }
    if (!form.harga_beli || form.harga_beli <= 0) { toast.error("Harga beli wajib diisi"); return; }
    if (!form.harga_jual || form.harga_jual <= 0) { toast.error("Harga jual wajib diisi"); return; }
    setSaving(true);
    try {
      // category_id & supplier_id wajib UUID — omit dari body kalau kosong
      const body: Record<string, unknown> = {
        sku_code: form.sku_code || form.nama_barang.toUpperCase().replace(/\s+/g, "-").slice(0, 12),
        name: form.nama_barang,
        buy_price: form.harga_beli,
        sell_price: form.harga_jual,
        current_stock: form.jumlah_stok_awal,
        min_stock: form.min_stok,
        rack_location: form.kode_rak,
      };
      if (form.category_id) body.category_id = form.category_id;
      if (form.supplier_id) body.supplier_id = form.supplier_id;
      await inventoryApi.createProduct(body);
      toast.success("Barang berhasil ditambahkan!");
      setShowAddModal(false);
      setForm(emptyForm);
      // Refresh list
      const res = await inventoryApi.getProducts();
      const payload2 = res as Record<string, unknown>;
      const newList = Array.isArray(payload2.data) ? payload2.data : Array.isArray(res) ? res : [];
      if (newList.length) setItems(newList as InventoryItem[]);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Gagal menambahkan barang");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (item: InventoryItem) => {
    setEditForm({
      name: item.name,
      sell_price: Number(item.sell_price),
      buy_price: Number(item.buy_price),
      current_stock: item.current_stock,
      rack_location: item.rack_location,
    });
    setShowEditModal(item);
  };

  const handleEdit = async () => {
    if (!showEditModal) return;
    setSaving(true);
    try {
      // Gunakan PUT /inventory/{id} untuk update individual
      await inventoryApi.updateProduct(showEditModal.id, {
        name: editForm.name,
        buy_price: editForm.buy_price,
        sell_price: editForm.sell_price,
        current_stock: editForm.current_stock,
        rack_location: editForm.rack_location,
      });
      // Re-fetch untuk konfirmasi backend tersimpan
      const fresh = await inventoryApi.getProducts();
      const list = (fresh as Record<string, unknown>).data ?? fresh;
      if (Array.isArray(list) && list.length) {
        setItems(list as InventoryItem[]);
      } else {
        setItems((prev) => prev.map((i) => i.id === showEditModal.id
          ? { ...i, name: editForm.name, current_stock: editForm.current_stock, rack_location: editForm.rack_location, buy_price: String(editForm.buy_price), sell_price: String(editForm.sell_price) }
          : i));
      }
      toast.success("Barang berhasil diupdate!");
      setShowEditModal(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Gagal mengupdate barang");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: InventoryItem) => {
    try {
      await inventoryApi.deleteProduct(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success("Barang dihapus");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Gagal menghapus barang");
    }
    setShowDeleteModal(null);
  };

  const kondisiBadge = (k: string) => {
    if (k === "Rusak Ringan") return <span className="px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-md">{k}</span>;
    if (k === "Rusak Berat") return <span className="px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-md">{k}</span>;
    return <span className="px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-md">{k}</span>;
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopNav />
      <main className="flex-1 p-6 animate-fade-in">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900">Inventaris Barang</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola data seluruh material dan produk di gudang utama.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-5 animate-slide-up">
          {/* Stok Habis */}
          <div className="relative overflow-hidden bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-full -translate-y-8 translate-x-8 opacity-60" />
            <div className="relative">
              <Ban size={22} className="text-red-500 mb-3" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Stok Habis</p>
              <p className="text-4xl font-bold text-red-600 leading-none">{localSummary.stokHabis}</p>
              <p className="text-sm text-gray-400 mt-1">Items</p>
            </div>
          </div>
          {/* Dibawah Minimum */}
          <div className="relative overflow-hidden bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -translate-y-8 translate-x-8 opacity-60" />
            <div className="relative">
              <ChevronDown size={22} className="text-amber-500 mb-3" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Dibawah Minimum</p>
              <p className="text-4xl font-bold text-amber-500 leading-none">{localSummary.dibawahMin}</p>
              <p className="text-sm text-gray-400 mt-1">Items</p>
            </div>
          </div>
          {/* Barang Akan Expired */}
          <div className="relative overflow-hidden bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full -translate-y-8 translate-x-8 opacity-60" />
            <div className="relative">
              <ChevronDown size={22} className="text-green-500 mb-3" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Barang Akan Expired</p>
              <p className="text-4xl font-bold text-green-600 leading-none">{localSummary.akanExpired}</p>
              <p className="text-sm text-gray-400 mt-1">Items</p>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="page-card animate-slide-up stagger-2">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 gap-3">
            <div className="flex items-center gap-2 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama, SKU, ID..."
                  className="form-input pl-8 text-sm py-2 w-full"
                />
              </div>
              <select value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)}
                className="form-select text-sm py-2">
                <option>Semua Kategori</option>
                <option>Semen</option><option>Besi</option><option>Cat</option><option>Pipa</option>
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="form-select text-sm py-2">
                <option>Semua Status</option>
                <option>In Stock</option><option>Stok Rendah</option><option>Stok Habis</option>
              </select>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href="/inventory/bulk-update" className="btn-secondary text-xs py-2">
                <RefreshCw size={14} /> Perbarui Sekaligus
              </Link>
              <button onClick={() => setShowAddModal(true)} className="btn-primary text-xs py-2">
                <Plus size={14} /> Tambah Barang
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th><input type="checkbox" className="rounded" /></th>
                  <th>SKU</th>
                  <th>Nama Barang</th>
                  <th>Kondisi</th>
                  <th>Stok</th>
                  <th>Min. Stok</th>
                  <th>Harga Beli</th>
                  <th>Harga Jual</th>
                  <th>Rak</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="text-center py-10 text-gray-400">Memuat data...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-10 text-gray-400">
                      {search ? `Tidak ada hasil untuk "${search}"` : "Belum ada data produk"}
                    </td>
                  </tr>
                ) : filtered.map((item) => {
                  const stockStatus = item.current_stock === 0 ? "habis"
                    : item.current_stock <= item.min_stock ? "rendah" : "aman";
                  return (
                    <tr key={item.id} className="animate-fade-in">
                      <td><input type="checkbox" className="rounded" /></td>
                      <td className="font-mono text-xs text-gray-500">{item.sku_code}</td>
                      <td>
                        <div>
                          <p className={`font-medium ${item.current_stock === 0 ? "text-red-600" : "text-gray-800"}`}>
                            {item.name}
                          </p>
                        </div>
                      </td>
                      <td>{kondisiBadge(item.defective_stock > 0 ? "Rusak Ringan" : "Baru")}</td>
                      <td>
                        <span className={`font-semibold ${stockStatus === "habis" ? "text-red-600" : stockStatus === "rendah" ? "text-amber-600" : "text-gray-800"}`}>
                          {item.current_stock.toLocaleString("id-ID")}
                        </span>{" "}
                        <span className="text-gray-400 text-xs">unit</span>
                      </td>
                      <td className="text-gray-500 text-sm">{item.min_stock.toLocaleString("id-ID")}</td>
                      <td className="text-gray-700">{formatRupiah(Number(item.buy_price))}</td>
                      <td className="font-medium text-gray-900">{formatRupiah(Number(item.sell_price))}</td>
                      <td>
                        <span className="font-mono text-xs text-blue-600">{item.rack_location}</span>
                      </td>
                      <td>
                        {stockStatus === "habis" && <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded-md">Habis</span>}
                        {stockStatus === "rendah" && <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 rounded-md">Rendah</span>}
                        {stockStatus === "aman" && <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-md">Aman</span>}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => setShowDeleteModal(item)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>Menampilkan 1-{filtered.length} dari 1,248 barang</span>
            <div className="flex items-center gap-1">
              <button className="w-7 h-7 rounded text-xs hover:bg-gray-100 text-gray-500">‹</button>
              {[1, 2, 3].map((p) => (
                <button key={p} className={`w-7 h-7 rounded text-xs ${p === 1 ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-600"}`}>{p}</button>
              ))}
              <span className="w-7 h-7 flex items-center justify-center text-xs text-gray-400">...</span>
              <button className="w-7 h-7 rounded text-xs hover:bg-gray-100 text-gray-600">250</button>
              <button className="w-7 h-7 rounded text-xs hover:bg-gray-100 text-gray-500">›</button>
            </div>
          </div>
        </div>
      </main>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 modal-overlay">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl modal-content mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Tambah Barang Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">Informasi Dasar</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Nama Barang *</label>
                      <input value={form.nama_barang} onChange={(e) => setForm({ ...form, nama_barang: e.target.value })}
                        placeholder="Contoh: Semen Gresik 50kg" className="form-input" />
                    </div>
                    <div>
                      <label className="form-label">Kode SKU *</label>
                      <input value={form.sku_code} onChange={(e) => setForm({ ...form, sku_code: e.target.value })}
                        placeholder="Contoh: PIP-WV-AW12" className="form-input font-mono" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Kategori <span className="text-gray-400">(Opsional)</span></label>
                      <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="form-select">
                        <option value="">-- Pilih Kategori --</option>
                        {categoryOptions.map((c) => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Supplier <span className="text-gray-400">(Opsional)</span></label>
                      <select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} className="form-select">
                        <option value="">-- Pilih Supplier --</option>
                        {supplierOptions.map((s) => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Kode Rak / Lokasi</label>
                    <input value={form.kode_rak} onChange={(e) => setForm({ ...form, kode_rak: e.target.value })}
                      placeholder="Contoh: R-C3-12" className="form-input" />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">Stok & Harga</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Stok Awal *</label>
                      <input type="number" value={form.jumlah_stok_awal} onChange={(e) => setForm({ ...form, jumlah_stok_awal: +e.target.value })}
                        className="form-input" min={0} />
                    </div>
                    <div>
                      <label className="form-label">Stok Minimum *</label>
                      <input type="number" value={form.min_stok} onChange={(e) => setForm({ ...form, min_stok: +e.target.value })}
                        className="form-input" min={0} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Harga Beli (Rp) *</label>
                      <input type="number" value={form.harga_beli} onChange={(e) => setForm({ ...form, harga_beli: +e.target.value })}
                        placeholder="0" className="form-input" />
                    </div>
                    <div>
                      <label className="form-label">Harga Jual (Rp) *</label>
                      <input type="number" value={form.harga_jual} onChange={(e) => setForm({ ...form, harga_jual: +e.target.value })}
                        placeholder="0" className="form-input" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary">Batal</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Simpan Barang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 modal-overlay">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl modal-content mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Edit Barang</h3>
              <button onClick={() => setShowEditModal(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="form-label">Nama Barang</label>
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="form-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Harga Beli (Rp)</label>
                  <input type="number" value={editForm.buy_price} onChange={(e) => setEditForm({ ...editForm, buy_price: +e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Harga Jual (Rp)</label>
                  <input type="number" value={editForm.sell_price} onChange={(e) => setEditForm({ ...editForm, sell_price: +e.target.value })} className="form-input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Stok</label>
                  <input type="number" value={editForm.current_stock} onChange={(e) => setEditForm({ ...editForm, current_stock: +e.target.value })} className="form-input" min={0} />
                </div>
                <div>
                  <label className="form-label">Kode Rak</label>
                  <input value={editForm.rack_location} onChange={(e) => setEditForm({ ...editForm, rack_location: e.target.value })} className="form-input" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowEditModal(null)} className="btn-secondary">Batal</button>
              <button onClick={handleEdit} disabled={saving} className="btn-primary">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 modal-overlay">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl modal-content mx-4 p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Barang?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Apakah Anda yakin ingin menghapus <strong>{showDeleteModal.name}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(null)} className="btn-secondary flex-1 justify-center">Batal</button>
              <button onClick={() => { if (showDeleteModal) handleDelete(showDeleteModal); }} disabled={saving} className="btn-danger flex-1 justify-center">
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}