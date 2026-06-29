"use client";

import { useState, useEffect } from "react";
import TopNav from "@/components/layout/TopNav";
import { Plus, Download, Gift, MoreVertical, X, Loader2, Users, UserCheck, Star } from "lucide-react";
import toast from "react-hot-toast";
import type { VipMember } from "@/types";
import { membersApi } from "@/lib/api";

type Member = VipMember;

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("All Levels");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRedeem, setShowRedeem] = useState(false);
  const [form, setForm] = useState({ nama: "", phone_number: "", level: "Bronze", poin_awal: 0 });
  const [saving, setSaving] = useState(false);
  const [apiStats, setApiStats] = useState<{ total_members: number; active_members: number; total_poin_issued: number } | null>(null);

  // Redeem state
  const [redeemForm, setRedeemForm] = useState({ member_id: "", poin_ditukar: 0, jenis_penukaran: "CASHBACK" });
  const [redeeming, setRedeeming] = useState(false);

  const fetchMembers = () => {
    setLoading(true);
    membersApi.getVipMembers({ limit: 100 })
      .then((res) => {
        setMembers(res?.items || []);
        setApiStats(res?.stats || null);
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

  const filtered = members.filter((m) => {
    const namaMatch = m.nama ? m.nama.toLowerCase().includes(search.toLowerCase()) : false;
    const phoneMatch = m.phone_number ? m.phone_number.includes(search) : false;
    const matchSearch = namaMatch || phoneMatch;
    const matchLevel = filterLevel === "All Levels" || m.level === filterLevel;
    return matchSearch && matchLevel;
  });

  const stats = {
    total: apiStats?.total_members ?? members.length,
    active: apiStats?.active_members ?? members.filter((m) => m.last_transaction !== "").length,
    totalPoin: apiStats?.total_poin_issued ?? members.reduce((s, m) => s + (m.poin || 0), 0),
  };

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
      const newMember = await membersApi.createVipMember({
        nama: form.nama,
        phone_number: form.phone_number,
        level: form.level as "Gold" | "Silver" | "Bronze",
        poin_awal: form.poin_awal,
      });
      setMembers((prev) => [...prev, newMember]);
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

  const handleRedeem = async () => {
    if (!redeemForm.member_id) {
      toast.error("Pilih member terlebih dahulu");
      return;
    }
    if (redeemForm.poin_ditukar <= 0) {
      toast.error("Jumlah poin harus lebih dari 0");
      return;
    }
    setRedeeming(true);
    try {
      const res = await membersApi.redeemPoints(redeemForm.member_id, {
        poin_ditukar: redeemForm.poin_ditukar,
        jenis_penukaran: redeemForm.jenis_penukaran,
      });
      toast.success(res.message || "Poin berhasil ditukarkan!");
      setShowRedeem(false);
      setRedeemForm({ member_id: "", poin_ditukar: 0, jenis_penukaran: "CASHBACK" });
      fetchMembers();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Gagal menukar poin";
      toast.error(msg);
    } finally {
      setRedeeming(false);
    }
  };

  const handleExport = () => {
    toast.success("Mengekspor data member...");
    window.open("/api/v1/members/vip/export", "_blank");
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopNav />
      <main className="flex-1 p-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Member VIP</h1>
            <p className="text-sm text-gray-500 mt-0.5">Overview and administration of loyalty program members.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExport} className="btn-secondary text-sm"><Download size={15} /> Export List</button>
            <button onClick={() => setShowRedeem(true)} className="btn-secondary text-sm"><Gift size={15} /> Redeem Points</button>
            <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm"><Plus size={15} /> Tambah Member Baru</button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-5 animate-slide-up">
          {[
            { label: "Total Members", value: stats.total.toLocaleString("id-ID"), sub: "↑12% vs last month", icon: Users, color: "blue" },
            { label: "Active Members", value: stats.active.toString(), sub: "71% engagement rate", icon: UserCheck, color: "green" },
            { label: "Total Points Issued", value: `${(stats.totalPoin / 1000).toFixed(1)}k`, sub: "↑5.4k this week", icon: Star, color: "orange" },
          ].map((s, i) => (
            <div key={i} className={`stat-card flex items-center gap-4 stagger-${i + 1}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                s.color === "blue" ? "bg-blue-100" : s.color === "green" ? "bg-green-100" : "bg-orange-100"}`}>
                <s.icon size={20} className={
                  s.color === "blue" ? "text-blue-600" : s.color === "green" ? "text-green-600" : "text-orange-600"} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-green-600">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="page-card animate-slide-up stagger-2">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members..." className="form-input text-sm py-2 w-64" />
            <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="form-select text-sm py-2 w-36">
              <option>All Levels</option>
              <option>Gold</option><option>Silver</option><option>Bronze</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID Member</th>
                  <th>Nama</th>
                  <th>Phone Number</th>
                  <th>Level</th>
                  <th>Balance Poin</th>
                  <th>Join Date</th>
                  <th>Last Transaction</th>
                  <th></th>
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
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-sm text-gray-400">
                      Belum ada member VIP terdaftar.
                    </td>
                  </tr>
                ) : (
                  filtered.map((m) => (
                    <tr key={m.member_id} className="animate-fade-in">
                      <td className="font-mono text-sm font-semibold text-gray-700">{m.member_id}</td>
                      <td className="font-medium text-gray-900">{m.nama}</td>
                      <td className="text-gray-600 text-sm">{m.phone_number}</td>
                      <td>{levelBadge(m.level)}</td>
                      <td className="font-semibold text-gray-800">{(m.poin || 0).toLocaleString("id-ID")}</td>
                      <td className="text-gray-500 text-sm">
                        {m.join_date ? new Date(m.join_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                      </td>
                      <td className="text-gray-500 text-sm">{m.last_transaction || "-"}</td>
                      <td>
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
                          <MoreVertical size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>Showing 1 to {filtered.length} of {members.length} entries</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, "...", ">"].map((p, i) => (
                <button key={i} className={`w-7 h-7 rounded text-xs ${p === 1 ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-600"}`}>{p}</button>
              ))}
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
                  placeholder="Nama lengkap atau perusahaan" className="form-input" />
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

      {/* Redeem Modal */}
      {showRedeem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 modal-overlay">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl modal-content mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Penukaran Poin Member VIP</h3>
              <button onClick={() => setShowRedeem(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="form-label">Pilih Member VIP</label>
                <select value={redeemForm.member_id} onChange={(e) => {
                  const m = members.find(x => x.member_id === e.target.value);
                  setRedeemForm({ ...redeemForm, member_id: e.target.value, poin_ditukar: m ? Math.min(100, m.poin) : 0 });
                }} className="form-select">
                  <option value="">-- Pilih Member --</option>
                  {members.map(m => (
                    <option key={m.member_id} value={m.member_id}>{m.nama} (Poin: {m.poin || 0})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Poin yang Ditukar</label>
                <input type="number" value={redeemForm.poin_ditukar || ""} onChange={(e) => setRedeemForm({ ...redeemForm, poin_ditukar: +e.target.value })}
                  placeholder="Contoh: 100" className="form-input" min={1} />
              </div>
              <div>
                <label className="form-label">Jenis Penukaran</label>
                <select value={redeemForm.jenis_penukaran} onChange={(e) => setRedeemForm({ ...redeemForm, jenis_penukaran: e.target.value })} className="form-select">
                  <option value="CASHBACK">Cashback</option>
                  <option value="VOUCHER">Voucher</option>
                  <option value="GIFT">Hadiah / Barang</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowRedeem(false)} className="btn-secondary">Batal</button>
              <button onClick={handleRedeem} disabled={redeeming} className="btn-primary">
                {redeeming ? <Loader2 size={14} className="animate-spin" /> : <Gift size={14} />}
                Tukarkan Poin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
