"use client";

import { useState, useEffect } from "react";
import TopNav from "@/components/layout/TopNav";
import { Plus, Pencil, Trash2, X, Loader2, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import type { VipMember } from "@/types";
import { membersApi } from "@/lib/api";

type Member = VipMember & { member_code?: string };

const ITEMS_PER_PAGE = 10;

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("Semua Level");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [deleteMember, setDeleteMember] = useState<Member | null>(null);
  const [form, setForm] = useState({ nama: "", phone_number: "", level: "Bronze", poin_awal: 0 });
  const [saving, setSaving] = useState(false);

  const fetchMembers = () => {
    setLoading(true);
    membersApi.getVipMembers({ limit: 200 })
      .then((res) => {
        setMembers((res as any)?.items || []);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Gagal memuat daftar member VIP");
        setMembers([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterLevel]);

  const filtered = members.filter((m) => {
    const matchSearch = m.nama?.toLowerCase().includes(search.toLowerCase()) ||
      m.phone_number?.includes(search) ||
      (m.member_code ?? "").toLowerCase().includes(search.toLowerCase());
    const matchLevel = filterLevel === "Semua Level" || m.level === filterLevel;
    return matchSearch && matchLevel;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const levelBadge = (l: string) => {
    const styles: Record<string, string> = {
      Gold: "bg-amber-100 text-amber-700 border border-amber-200",
      Silver: "bg-slate-100 text-slate-700 border border-slate-200",
      Bronze: "bg-orange-100 text-orange-700 border border-orange-200",
    };
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${styles[l] ?? "bg-gray-100 text-gray-700"}`}>{l}</span>;
  };

  const handleSave = async () => {
    if (!form.nama.trim() || !form.phone_number.trim()) {
      toast.error("Nama dan nomor HP wajib diisi");
      return;
    }
    setSaving(true);
    try {
      await membersApi.createVipMember({
        nama: form.nama,
        phone_number: form.phone_number,
        level: form.level as "Gold" | "Silver" | "Bronze",
        poin_awal: form.poin_awal,
      });
      toast.success("Member VIP berhasil ditambahkan!");
      setShowAddModal(false);
      setForm({ nama: "", phone_number: "", level: "Bronze", poin_awal: 0 });
      fetchMembers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Gagal menambahkan member");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editMember) return;
    if (!editMember.nama?.trim() || !editMember.phone_number?.trim()) {
      toast.error("Nama dan nomor HP wajib diisi");
      return;
    }
    setSaving(true);
    try {
      await membersApi.updateMember(editMember.member_id, {
        nama: editMember.nama,
        phone_number: editMember.phone_number,
        level: editMember.level,
        poin: editMember.poin,
      });
      toast.success("Data member berhasil diperbarui!");
      setEditMember(null);
      fetchMembers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Gagal memperbarui member");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteMember) return;
    try {
      await membersApi.deleteMember(deleteMember.member_id);
      setMembers((prev) => prev.filter((m) => m.member_id !== deleteMember.member_id));
      toast.success("Member berhasil dihapus");
      setDeleteMember(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Gagal menghapus member");
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopNav />
      <main className="flex-1 p-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Member VIP</h1>
            <p className="text-sm text-gray-500 mt-0.5">Kelola dan pantau program loyalitas pelanggan.</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm">
            <Plus size={15} /> Tambah Member Baru
          </button>
        </div>

        {/* Table */}
        <div className="page-card animate-slide-up stagger-2">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, no. HP, atau kode member..." className="form-input text-sm py-2 w-72" />
              <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="form-select text-sm py-2 w-36">
                <option>Semua Level</option>
                <option>Gold</option><option>Silver</option><option>Bronze</option>
              </select>
            </div>
            <span className="text-xs text-gray-400">{filtered.length} member ditemukan</span>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kode Member</th>
                  <th>Nama</th>
                  <th>Nomor HP</th>
                  <th>Level</th>
                  <th>Poin</th>
                  <th>Tanggal Daftar</th>
                  <th>Transaksi Terakhir</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="animate-spin text-blue-600" size={24} />
                        <span className="text-sm text-gray-500">Memuat data member...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-sm text-gray-400">
                      {search || filterLevel !== "Semua Level" ? "Tidak ada member yang cocok dengan filter." : "Belum ada member VIP terdaftar."}
                    </td>
                  </tr>
                ) : (
                  paginated.map((m) => (
                    <tr key={m.member_id} className="animate-fade-in">
                      <td className="font-mono text-sm font-bold text-blue-700">{(m as any).member_code ?? "-"}</td>
                      <td className="font-medium text-gray-900">{m.nama}</td>
                      <td className="text-gray-600 text-sm">{m.phone_number}</td>
                      <td>{levelBadge(m.level)}</td>
                      <td className="font-semibold text-gray-800">{(m.poin || 0).toLocaleString("id-ID")}</td>
                      <td className="text-gray-500 text-sm">
                        {m.join_date ? new Date(m.join_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                      </td>
                      <td className="text-gray-500 text-sm">
                        {m.last_transaction ? new Date(m.last_transaction).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditMember({ ...m })}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteMember(m)}
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

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>
              Menampilkan {filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} dari {filtered.length} member
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | "...")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-gray-400">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p as number)}
                      className={`w-7 h-7 rounded text-xs font-medium ${currentPage === p ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-600"}`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 modal-overlay">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl modal-content mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Tambah Member VIP Baru</h3>
              <button onClick={() => setShowAddModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="form-label">Nama *</label>
                <input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="Nama lengkap pelanggan" className="form-input" />
              </div>
              <div>
                <label className="form-label">Nomor HP *</label>
                <input value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  placeholder="08xx-xxxx-xxxx" className="form-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Level</label>
                  <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="form-select">
                    <option>Bronze</option><option>Silver</option><option>Gold</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Poin Awal</label>
                  <input type="number" value={form.poin_awal} onChange={(e) => setForm({ ...form, poin_awal: +e.target.value })}
                    className="form-input" min={0} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary">Batal</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Simpan Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editMember && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 modal-overlay">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl modal-content mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Edit Member VIP</h3>
                <p className="text-xs text-gray-500">Kode: <span className="font-mono font-bold text-blue-600">{(editMember as any).member_code ?? "-"}</span></p>
              </div>
              <button onClick={() => setEditMember(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="form-label">Nama</label>
                <input value={editMember.nama} onChange={(e) => setEditMember({ ...editMember, nama: e.target.value })} className="form-input" />
              </div>
              <div>
                <label className="form-label">Nomor HP</label>
                <input value={editMember.phone_number} onChange={(e) => setEditMember({ ...editMember, phone_number: e.target.value })} className="form-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Level</label>
                  <select value={editMember.level} onChange={(e) => setEditMember({ ...editMember, level: e.target.value as any })} className="form-select">
                    <option>Bronze</option><option>Silver</option><option>Gold</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Poin</label>
                  <input type="number" value={editMember.poin} onChange={(e) => setEditMember({ ...editMember, poin: +e.target.value })} className="form-input" min={0} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setEditMember(null)} className="btn-secondary">Batal</button>
              <button onClick={handleEdit} disabled={saving} className="btn-primary">
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteMember && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 modal-overlay">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl modal-content mx-4 p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Member?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Apakah Anda yakin ingin menghapus member <strong>{deleteMember.nama}</strong> ({(deleteMember as any).member_code ?? deleteMember.phone_number})?
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteMember(null)} className="btn-secondary flex-1 justify-center">Batal</button>
              <button onClick={handleDelete} className="btn-danger flex-1 justify-center">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
