"use client";

import { useState, useEffect } from "react";
import TopNav from "@/components/layout/TopNav";
import { Plus, Pencil, Trash2, Ban, ChevronDown, X, Save, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
// ChevronDown reused as "trending down" icon for stat cards
import Link from "next/link";
import { formatRupiah } from "@/lib/utils";
import toast from "react-hot-toast";
import { inventoryApi } from "@/lib/api";
import type { Product } from "@/types";

type InventoryItem = Product & { _displayStok?: number };

const MOCK_ITEMS: InventoryItem[] = [
  { id: "INV-001", sku_code: "SMN-TR50", name: "Semen Tiga Roda 50kg", category: "Semen", supplier: "-", buy_price: "48000", sell_price: "55000", current_stock: 145, defective_stock: 0, min_stock: 30, rack_location: "A1-R01" },
  { id: "INV-089", sku_code: "PKB-5CM", name: "Paku Beton 5cm", category: "Paku", supplier: "-", buy_price: "12000", sell_price: "15000", current_stock: 0, defective_stock: 0, min_stock: 20, rack_location: "C3-R12" },
  { id: "INV-042", sku_code: "CAT-DLX5", name: "Cat Tembok Dulux Putih 5kg", category: "Cat", supplier: "-", buy_price: "115000", sell_price: "135000", current_stock: 24, defective_stock: 0, min_stock: 10, rack_location: "B2-R05" },
  { id: "INV-112", sku_code: "PPA-WAV12", name: "Pipa PVC Wavin 1/2\"", category: "Pipa", supplier: "-", buy_price: "22000", sell_price: "28000", current_stock: 18, defective_stock: 2, min_stock: 20, rack_location: "D1-R08" },
  { id: "INV-005", sku_code: "SMN-HLC40", name: "Semen Holcim 40kg", category: "Semen", supplier: "-", buy_price: "42000", sell_price: "49000", current_stock: 88, defective_stock: 0, min_stock: 30, rack_location: "A1-R02" },
  { id: "INV-215", sku_code: "PPA-WAV3", name: "Pipa PVC Wavin 3 Inch", category: "Pipa", supplier: "-", buy_price: "35000", sell_price: "45000", current_stock: 75, defective_stock: 0, min_stock: 20, rack_location: "B-12" },
];

const emptyForm = {
  nama_barang: "",
  sku_code: "",
  category_id: "",
  supplier_id: "",
  kondisi: "Baru" as const,
  jumlah_stok_awal: 0,
  satuan: "",
  kode_rak: "",
  harga_beli: 0,
  harga_jual: 0,
  stok_minimum: 10,
  tanggal_kadaluarsa: "",
};

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(MOCK_ITEMS);
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("Semua Kategori");
  const [filterStatus, setFilterStatus] = useState("Semua Status");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ stok_habis: 0, di_bawah_minimum: 0, akan_expired: 0 });

  useEffect(() => {
    inventoryApi.getProducts()
      .then((res) => {
        if (res.data?.length) setItems(res.data);
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
    if (!form.nama_barang.trim() || !form.sku_code.trim()) {
      toast.error("Nama barang dan SKU wajib diisi");
      return;
    }
    if (!uuidRegex.test(form.category_id) || !uuidRegex.test(form.supplier_id)) {
      toast.error("Category ID dan Supplier ID harus berupa UUID dari backend");
      return;
    }
    if (form.harga_beli <= 0 || form.harga_jual <= 0) {
      toast.error("Harga beli dan harga jual wajib lebih dari 0");
      return;
    }
    setSaving(true);
    try {
      await inventoryApi.createProduct({
        sku_code: form.sku_code,
        name: form.nama_barang,
        category_id: form.category_id,
        supplier_id: form.supplier_id,
        buy_price: form.harga_beli,
        sell_price: form.harga_jual,
        current_stock: form.jumlah_stok_awal,
        min_stock: form.stok_minimum,
        rack_location: form.kode_rak,
      });
      toast.success("Barang berhasil ditambahkan!");
      setShowAddModal(false);
      setForm(emptyForm);
      // Refresh list
      const res = await inventoryApi.getProducts();
      if (res.data?.length) setItems(res.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Gagal menambahkan barang");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteModal) return;
    try {
      await inventoryApi.deleteProduct(showDeleteModal.id);
      setItems((prev) => prev.filter((item) => item.id !== showDeleteModal.id));
      toast.success("Barang dihapus");
      setShowDeleteModal(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Gagal menghapus barang");
    }
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
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
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
            <div className="flex items-center gap-2">
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
                  <th>ID</th>
                  <th>Nama Barang</th>
                  <th>Kondisi</th>
                  <th>Stok</th>
                  <th>Harga Beli</th>
                  <th>Harga Jual</th>
                  <th>Exp. Date</th>
                  <th>Rak</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="animate-fade-in">
                    <td><input type="checkbox" className="rounded" /></td>
                    <td className="font-mono text-xs text-gray-500">{item.id}</td>
                    <td>
                      <Link href={`/inventory/${item.id}`} className={`font-medium hover:underline ${item.current_stock === 0 ? "text-red-600" : "text-gray-800"}`}>
                        {item.name}
                      </Link>
                    </td>
                    <td>{kondisiBadge(item.defective_stock > 0 ? "Rusak Ringan" : "Baru")}</td>
                    <td>
                      <span className={`font-semibold ${item.current_stock === 0 ? "text-red-600" : item.current_stock <= item.min_stock ? "text-amber-600" : "text-gray-800"}`}>
                        {item.current_stock}
                      </span>{" "}
                      <span className="text-gray-400 text-xs">unit</span>
                    </td>
                    <td className="text-gray-700">{formatRupiah(Number(item.buy_price))}</td>
                    <td className="text-gray-700">{formatRupiah(Number(item.sell_price))}</td>
                    <td className="text-gray-500 text-xs">
                      -
                    </td>
                    <td>
                      <Link href={`/inventory/${item.id}`} className="text-blue-600 hover:underline text-xs font-mono">
                        {item.rack_location ?? "-"}
                      </Link>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => setShowDeleteModal(item)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                  <div>
                    <label className="form-label">Nama Barang *</label>
                    <input value={form.nama_barang} onChange={(e) => setForm({ ...form, nama_barang: e.target.value })}
                      placeholder="Contoh: Semen Gresik 50kg" className="form-input" />
                  </div>
                  <div>
                    <label className="form-label">SKU *</label>
                    <input value={form.sku_code} onChange={(e) => setForm({ ...form, sku_code: e.target.value })}
                      placeholder="Contoh: SMN-GRSK-50" className="form-input font-mono" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Category ID *</label>
                      <input value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                        placeholder="UUID kategori" className="form-input font-mono text-xs" />
                    </div>
                    <div>
                      <label className="form-label">Supplier ID *</label>
                      <input value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                        placeholder="UUID supplier" className="form-input font-mono text-xs" />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">Stok & Harga</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Jumlah Stok Awal *</label>
                      <input type="number" value={form.jumlah_stok_awal} onChange={(e) => setForm({ ...form, jumlah_stok_awal: +e.target.value })}
                        className="form-input" min={0} />
                    </div>
                    <div>
                      <label className="form-label">Stok Minimum</label>
                      <input type="number" value={form.stok_minimum} onChange={(e) => setForm({ ...form, stok_minimum: +e.target.value })}
                        className="form-input" min={0} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Kode Rak / Lokasi</label>
                      <input value={form.kode_rak} onChange={(e) => setForm({ ...form, kode_rak: e.target.value })}
                        placeholder="CONTOH: A1-01" className="form-input" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Harga Beli (Rp) *</label>
                      <input type="number" value={form.harga_beli} onChange={(e) => setForm({ ...form, harga_beli: +e.target.value })}
                        placeholder="Rp 0" className="form-input" />
                    </div>
                    <div>
                      <label className="form-label">Harga Jual (Rp) *</label>
                      <input type="number" value={form.harga_jual} onChange={(e) => setForm({ ...form, harga_jual: +e.target.value })}
                        placeholder="Rp 0" className="form-input" />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Tanggal Kadaluarsa <span className="text-gray-400">(Opsional)</span></label>
                    <input type="date" value={form.tanggal_kadaluarsa} onChange={(e) => setForm({ ...form, tanggal_kadaluarsa: e.target.value })}
                      className="form-input" />
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
              <button onClick={handleDelete} className="btn-danger flex-1 justify-center">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
