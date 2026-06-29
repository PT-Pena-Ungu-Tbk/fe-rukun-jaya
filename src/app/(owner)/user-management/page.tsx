"use client";

import { useState, useEffect } from "react";
import TopNav from "@/components/layout/TopNav";
import { Plus, Pencil, Trash2, X, Loader2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { employeesApi, type Employee } from "@/lib/api";

interface Staff {
  id: string; employee_id: string; full_name: string;
  jabatan: string; login_time: string; is_active: boolean;
  email?: string;
}

const toStaff = (e: Employee): Staff => ({
  id: e.id,
  employee_id: e.id,
  full_name: e.name,
  jabatan: e.role === "OWNER" ? "Owner" : "Cashier",
  login_time: "-",
  is_active: e.is_active ?? true,
  email: e.email,
});

const jabatanBadge = (j: string) => {
  const styles: Record<string, string> = {
    Owner: "bg-blue-100 text-blue-700",
    Cashier: "bg-gray-100 text-gray-700",
    Manager: "bg-purple-100 text-purple-700",
    "Warehouse Admin": "bg-green-100 text-green-700",
  };
  return <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${styles[j] ?? "bg-gray-100 text-gray-600"}`}>{j}</span>;
};

export default function UserManagementPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editStaff, setEditStaff] = useState<Staff | null>(null);
  const [deleteStaff, setDeleteStaff] = useState<Staff | null>(null);
  const [saving, setSaving] = useState(false);
  const [newForm, setNewForm] = useState({ full_name: "", role: "CASHIER", phone_number: "", email: "", password: "" });
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    setLoading(true);
    employeesApi.getList()
      .then((res) => setStaff(res.data?.map(toStaff) || []))
      .catch((err) => {
        console.error(err);
        toast.error("Gagal memuat daftar karyawan");
        setStaff([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = staff.filter((s) =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) || s.employee_id.includes(search)
  );

  const toggleAccess = (id: string) => {
    const previous = staff;
    setStaff((prev) => prev.map((s) => s.id === id ? { ...s, is_active: !s.is_active } : s));
    employeesApi.toggleAccess(id)
      .then((res) => {
        setStaff((prev) => prev.map((s) => s.id === id ? { ...s, is_active: res.is_active } : s));
        toast.success(res.message ?? "Status akses diperbarui");
      })
      .catch((err: unknown) => {
        setStaff(previous);
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(msg ?? "Gagal mengubah status akses");
      });
  };

  const handleAdd = async () => {
    setSaving(true);
    try {
      const created = await employeesApi.create({
        name: newForm.full_name,
        role: newForm.role as "CASHIER" | "OWNER",
        email: newForm.email,
        password: newForm.password,
      });
      setStaff((prev) => [...prev, toStaff(created.data)]);
      toast.success("Karyawan berhasil ditambahkan!");
      setShowAddModal(false);
      setNewForm({ full_name: "", role: "CASHIER", phone_number: "", email: "", password: "" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Gagal menambahkan karyawan");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editStaff) return;
    setSaving(true);
    try {
      await employeesApi.update(editStaff.id, {
        name: editStaff.full_name,
        email: editStaff.email,
        role: editStaff.jabatan === "Owner" ? "OWNER" : "CASHIER",
      });
      setStaff((prev) => prev.map((s) => s.id === editStaff.id ? editStaff : s));
      toast.success("Data karyawan diperbarui!");
      setEditStaff(null);
    } catch {
      toast.error("Gagal memperbarui karyawan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteStaff) return;
    try {
      await employeesApi.delete(deleteStaff.id);
      setStaff((prev) => prev.filter((s) => s.id !== deleteStaff.id));
      toast.success("Karyawan dihapus");
      setDeleteStaff(null);
    } catch {
      toast.error("Gagal menghapus karyawan");
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopNav />
      <main className="flex-1 p-6 animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Karyawan & Kontrol Akses</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pemantauan Karyawan aktif dan manajemen izin.</p>
        </div>

        <div className="page-card animate-slide-up">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="relative w-64">
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search staff..." className="form-input text-sm py-2 pl-9" />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
            <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm">
              <Plus size={14} /> Add New User
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID Karyawan</th>
                  <th>Nama Lengkap</th>
                  <th>Jabatan</th>
                  <th>Login</th>
                  <th>Access</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="animate-spin text-blue-600" size={24} />
                        <span className="text-sm text-gray-500">Memuat data karyawan...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-sm text-gray-400">
                      Belum ada karyawan terdaftar.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={s.id} className="animate-fade-in">
                    <td className="font-mono text-sm font-semibold text-gray-600">{s.employee_id}</td>
                    <td className="font-semibold text-gray-900">{s.full_name}</td>
                    <td>{jabatanBadge(s.jabatan)}</td>
                    <td className="text-gray-500 text-sm">{s.login_time}</td>
                    <td>
                      <button onClick={() => toggleAccess(s.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${s.is_active ? "bg-green-500" : "bg-red-400"}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${s.is_active ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditStaff(s)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => setDeleteStaff(s)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
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
                <Plus size={18} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Tambah Karyawan Baru</h3>
                <p className="text-xs text-gray-500">Input staff credentials for system access.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="ml-auto text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="form-label">Full Name</label>
                <input value={newForm.full_name} onChange={(e) => setNewForm({ ...newForm, full_name: e.target.value })}
                  placeholder="e.g. Ahmad Suhendar" className="form-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Role</label>
                  <select value={newForm.role} onChange={(e) => setNewForm({ ...newForm, role: e.target.value })} className="form-select">
                    <option value="">Select Role</option>
                    <option>OWNER</option><option>CASHIER</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Phone Number</label>
                  <input value={newForm.phone_number} onChange={(e) => setNewForm({ ...newForm, phone_number: e.target.value })}
                    placeholder="0812..." className="form-input" />
                </div>
              </div>
              <div>
                <label className="form-label">Email Address</label>
                <input type="email" value={newForm.email} onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                  placeholder="staff@lumbertrack.id" className="form-input" />
              </div>
              <div>
                <label className="form-label">System Password</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={newForm.password}
                    onChange={(e) => setNewForm({ ...newForm, password: e.target.value })}
                    className="form-input pr-10" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass ? "🙈" : "👁"}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Password must be at least 8 characters long.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary">Batal</button>
              <button onClick={handleAdd} disabled={saving} className="btn-primary">
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                Simpan Karyawan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editStaff && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 modal-overlay">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl modal-content mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Edit Karyawan</h3>
                <p className="text-xs text-gray-500">Perbarui informasi profil dan hak akses karyawan.</p>
              </div>
              <button onClick={() => setEditStaff(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="form-label">Nama Lengkap</label>
                <input value={editStaff.full_name}
                  onChange={(e) => setEditStaff({ ...editStaff, full_name: e.target.value })}
                  className="form-input" />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input value={editStaff.email ?? ""}
                  onChange={(e) => setEditStaff({ ...editStaff, email: e.target.value })}
                  className="form-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Role</label>
                  <select value={editStaff.jabatan}
                    onChange={(e) => setEditStaff({ ...editStaff, jabatan: e.target.value })} className="form-select">
                    <option>Owner</option><option>Cashier</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Status Akun</label>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => setEditStaff({ ...editStaff, is_active: !editStaff.is_active })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editStaff.is_active ? "bg-blue-600" : "bg-gray-300"}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${editStaff.is_active ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                    <span className="text-sm text-gray-600">{editStaff.is_active ? "Active" : "Inactive"}</span>
                  </div>
                </div>
              </div>
              {!editStaff.is_active && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 flex items-start gap-2">
                  <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                  Mengubah status menjadi Inactive akan segera mencabut semua akses user dari sistem secara real-time.
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setEditStaff(null)} className="btn-secondary">Batal</button>
              <button onClick={handleEdit} disabled={saving} className="btn-primary">
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteStaff && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 modal-overlay">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl modal-content mx-4 p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Karyawan?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Apakah Anda yakin ingin menghapus <strong>{deleteStaff.full_name}</strong>?
              Tindakan ini tidak dapat dibatalkan dan semua data terkait akan dihapus secara permanen.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteStaff(null)} className="btn-secondary flex-1 justify-center">Batal</button>
              <button onClick={handleDelete} className="btn-danger flex-1 justify-center">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
