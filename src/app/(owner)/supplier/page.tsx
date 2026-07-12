"use client";

import { useState, useEffect } from "react";
import TopNav from "@/components/layout/TopNav";
import { Building2, Plus, Pencil, Trash2, X, Loader2, AlertTriangle, Phone, Package } from "lucide-react";
import toast from "react-hot-toast";
import { suppliersApi } from "@/lib/api";
import type { Supplier } from "@/types";

const emptyForm = { name: "", contact_info: "" };

export default function SupplierPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [deleteSupplier, setDeleteSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchSuppliers = () => {
    setLoading(true);
    suppliersApi.getList()
      .then((res) => setSuppliers(res.data || []))
      .catch((err) => {
        console.error(err);
        toast.error("Gagal memuat daftar supplier");
        setSuppliers([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.contact_info ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!form.name.trim()) { toast.error("Nama supplier wajib diisi"); return; }
    setSaving(true);
    try {
      await suppliersApi.create({ name: form.name, contact_info: form.contact_info || undefined });
      toast.success("Supplier berhasil ditambahkan!");
      setShowAddModal(false);
      setForm(emptyForm);
      fetchSuppliers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Gagal menambahkan supplier");
    } finally { setSaving(false); }
  };

  const handleEdit = async () => {
    if (!editSupplier) return;
    if (!editSupplier.name.trim()) { toast.error("Nama supplier wajib diisi"); return; }
    setSaving(true);
    try {
      await suppliersApi.update(editSupplier.id, { name: editSupplier.name, contact_info: editSupplier.contact_info || undefined });
      toast.success("Supplier berhasil diperbarui!");
      setEditSupplier(null);
      fetchSuppliers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Gagal memperbarui supplier");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteSupplier) return;
    try {
      await suppliersApi.delete(deleteSupplier.id);
      setSuppliers((prev) => prev.filter((s) => s.id !== deleteSupplier.id));
      toast.success("Supplier berhasil dihapus");
      setDeleteSupplier(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Gagal menghapus supplier");
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopNav />
      <main className="flex-1 p-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Supplier</h1>
            <p className="text-sm text-gray-500 mt-0.5">Kelola data vendor dan pemasok barang toko.</p>
          </div>
          <button onClick={() => { setForm(emptyForm); setShowAddModal(true); }} className="btn-primary text-sm">
            <Plus size={15} /> Tambah Supplier
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                <Building2 size={18} className="text-blue-600" />
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Supplier</p>
            </div>
            <p className="text-4xl font-bold text-blue-600 leading-none">{suppliers.length}</p>
            <p className="text-sm text-gray-400 mt-1">Supplier Terdaftar</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
                <Package size={18} className="text-green-600" />
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Hasil Pencarian</p>
            </div>
            <p className="text-4xl font-bold text-green-600 leading-none">{filtered.length}</p>
            <p className="text-sm text-gray-400 mt-1">Supplier Ditemukan</p>
          </div>
        </div>

        {/* Table */}
        <div className="page-card animate-slide-up stagger-2">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau kontak supplier..."
              className="form-input text-sm py-2 w-72"
            />
            <span className="text-xs text-gray-400">{filtered.length} dari {suppliers.length} supplier</span>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Nama Supplier</th>
                  <th>Informasi Kontak</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="animate-spin text-blue-600" size={24} />
                        <span className="text-sm text-gray-500">Memuat data supplier...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-sm text-gray-400">
                      {search ? `Tidak ada supplier yang cocok dengan "${search}".` : "Belum ada supplier terdaftar. Klik \"Tambah Supplier\" untuk menambahkan."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((s, idx) => (
                    <tr key={s.id} className="animate-fade-in">
                      <td className="text-gray-400 text-sm font-medium">{idx + 1}</td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Building2 size={14} className="text-blue-600" />
                          </div>
                          <span className="font-semibold text-gray-900">{s.name}</span>
                        </div>
                      </td>
                      <td>
                        {s.contact_info ? (
                          <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                            <Phone size={12} className="text-gray-400" />
                            {s.contact_info}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-sm italic">Tidak ada kontak</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditSupplier({ ...s })}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteSupplier(s)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 modal-overlay">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl modal-content mx-4">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                <Building2 size={18} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Tambah Supplier Baru</h3>
                <p className="text-xs text-gray-500">Daftarkan pemasok baru ke dalam sistem.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="ml-auto text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="form-label">Nama Supplier *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: PT. Semen Indonesia"
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Info Kontak</label>
                <input
                  value={form.contact_info}
                  onChange={(e) => setForm({ ...form, contact_info: e.target.value })}
                  placeholder="No. HP, email, atau alamat"
                  className="form-input"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary">Batal</button>
              <button onClick={handleAdd} disabled={saving} className="btn-primary">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Simpan Supplier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editSupplier && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 modal-overlay">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl modal-content mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Edit Supplier</h3>
                <p className="text-xs text-gray-500">Perbarui informasi supplier.</p>
              </div>
              <button onClick={() => setEditSupplier(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="form-label">Nama Supplier *</label>
                <input
                  value={editSupplier.name}
                  onChange={(e) => setEditSupplier({ ...editSupplier, name: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Info Kontak</label>
                <input
                  value={editSupplier.contact_info ?? ""}
                  onChange={(e) => setEditSupplier({ ...editSupplier, contact_info: e.target.value })}
                  placeholder="No. HP, email, atau alamat"
                  className="form-input"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setEditSupplier(null)} className="btn-secondary">Batal</button>
              <button onClick={handleEdit} disabled={saving} className="btn-primary">
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteSupplier && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 modal-overlay">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl modal-content mx-4 p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Supplier?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Apakah Anda yakin ingin menghapus <strong>{deleteSupplier.name}</strong>?
              Supplier tidak dapat dihapus jika masih digunakan oleh produk.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteSupplier(null)} className="btn-secondary flex-1 justify-center">Batal</button>
              <button onClick={handleDelete} className="btn-danger flex-1 justify-center">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
