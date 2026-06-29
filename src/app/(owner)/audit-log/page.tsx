"use client";

import { useState, useEffect } from "react";
import TopNav from "@/components/layout/TopNav";
import { Download, Calendar, Pencil, Trash2, LogIn, RotateCcw, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { auditApi } from "@/lib/api";

interface AuditEntry {
  id: string;
  user: {
    nama: string;
    jabatan: string;
    avatar?: string; // initials fallback
    color: string;
    photo?: boolean;
  };
  tanggal: string;
  waktu: string;
  aktivitas: "Edit Harga" | "Hapus Barang" | "Login" | "Retur Pembelian";
  detail_utama: string;
  detail_sub?: string;
  nilai_lama?: string;
  nilai_baru?: string;
  status_text?: string;
  status_color?: string;
}

const mockLogs: AuditEntry[] = [
  {
    id: "1",
    user: { nama: "Siti Rahma", jabatan: "Admin Gudang", avatar: "SR", color: "bg-purple-400", photo: true },
    tanggal: "07 Okt 2023", waktu: "14:23:45 WIB",
    aktivitas: "Edit Harga",
    detail_utama: "Semen Tiga Roda 50kg (SKU: SMT-001)",
    nilai_lama: "Rp 55.000", nilai_baru: "Rp 58.000",
  },
  {
    id: "2",
    user: { nama: "Ahmad Wijaya", jabatan: "Manager", avatar: "AW", color: "bg-blue-600" },
    tanggal: "07 Okt 2023", waktu: "10:15:02 WIB",
    aktivitas: "Hapus Barang",
    detail_utama: "Cat Tembok Dulux 25kg (SKU: CTD-045)",
    detail_sub: "Alasan: Produk kadaluarsa/rusak. Menghapus 5 unit dari sistem.",
  },
  {
    id: "3",
    user: { nama: "Budi Santoso", jabatan: "Admin Sistem", avatar: "BS", color: "bg-gray-400", photo: true },
    tanggal: "07 Okt 2023", waktu: "08:00:12 WIB",
    aktivitas: "Login",
    detail_utama: "Sesi baru dimulai. IP: 192.168.1.104",
  },
  {
    id: "4",
    user: { nama: "Siti Rahma", jabatan: "Admin Gudang", avatar: "SR", color: "bg-purple-400", photo: true },
    tanggal: "06 Okt 2023", waktu: "16:45:10 WIB",
    aktivitas: "Retur Pembelian",
    detail_utama: "Besi Beton 12mm (PO-23091A)",
    detail_sub: "Retur 50 batang ke Supplier (PT. Baja Makmur). Status stok:",
    status_text: "Pending",
    status_color: "text-amber-500",
  },
];

const activityConfig: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  "Edit Harga":     { label: "Edit Harga",     bg: "bg-amber-100",  text: "text-amber-700",  icon: <Pencil size={11} /> },
  "Hapus Barang":   { label: "Hapus Barang",   bg: "bg-red-100",    text: "text-red-700",    icon: <Trash2 size={11} /> },
  "Login":          { label: "Login",           bg: "bg-blue-100",   text: "text-blue-700",   icon: <LogIn size={11} /> },
  "Retur Pembelian":{ label: "Retur Pembelian", bg: "bg-orange-100", text: "text-orange-700", icon: <RotateCcw size={11} /> },
};

// Map API aktivitas enum to local display enum
const toAktivitas = (a: string): AuditEntry["aktivitas"] => {
  const m: Record<string, AuditEntry["aktivitas"]> = {
    EDIT_HARGA: "Edit Harga",
    HAPUS_BARANG: "Hapus Barang",
    LOGIN: "Login",
    RETUR_PEMBELIAN: "Retur Pembelian",
  };
  return m[a] ?? "Login";
};

export default function AuditLogPage() {
  const [jenisFilter, setJenisFilter] = useState("Semua Aktivitas");
  const [dateRange] = useState("01 Okt 2023 - 07 Okt 2023");
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    auditApi.getLogs()
      .then((res) => {
        const items = res.data ?? [];
        const mapped: AuditEntry[] = items.map((raw, idx: number) => {
          const item = raw as unknown as Record<string, unknown>;
          const user = item.user as Record<string, string> | undefined;
          const userName = user?.nama ?? (item.user_name as string) ?? String(item.user_id ?? "User");
          const changes = item.changes_payload ? JSON.stringify(item.changes_payload) : undefined;
          return {
            id: String(item.id ?? idx),
            user: {
              nama: userName,
              jabatan: user?.jabatan ?? (item.role as string) ?? "-",
              avatar: userName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
              color: ["bg-purple-400", "bg-blue-600", "bg-gray-400", "bg-green-500"][idx % 4],
            },
            tanggal: new Date(String(item.created_at ?? item.waktu ?? Date.now())).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
            waktu: new Date(String(item.created_at ?? item.waktu ?? Date.now())).toLocaleTimeString("id-ID") + " WIB",
            aktivitas: toAktivitas(String(item.aktivitas ?? item.action ?? "LOGIN")),
            detail_utama: String(item.detail_perubahan ?? changes ?? item.description ?? "-"),
            nilai_lama: item.nilai_lama ? String(item.nilai_lama) : undefined,
            nilai_baru: item.nilai_baru ? String(item.nilai_baru) : undefined,
          };
        });
        setLogs(mapped);
        setTotalItems(items.length);
      })
      .catch(() => {
        setLogs([]);
        setTotalItems(0);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filtered = logs.filter((l) =>
    jenisFilter === "Semua Aktivitas" || l.aktivitas === jenisFilter
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopNav />
      <main className="flex-1 p-6 animate-fade-in">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Audit Log & Keamanan</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Pantau aktivitas sistem, perubahan data kritis, dan riwayat login pengguna.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 mb-4 shadow-sm flex items-end gap-4 animate-slide-up">
          {/* Date Range */}
          <div className="flex-1 max-w-xs">
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Rentang Tanggal</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 bg-white">
              <Calendar size={15} className="text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-700">{dateRange}</span>
            </div>
          </div>

          {/* Jenis Aktivitas */}
          <div className="w-52">
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Jenis Aktivitas</label>
            <div className="relative">
              <select
                value={jenisFilter}
                onChange={(e) => setJenisFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option>Semua Aktivitas</option>
                <option>Login</option>
                <option>Edit Harga</option>
                <option>Hapus Barang</option>
                <option>Retur Pembelian</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▾</span>
            </div>
          </div>

          {/* Spacer + Export */}
          <div className="ml-auto">
            <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium">
              <Download size={14} /> Ekspor CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-slide-up stagger-2">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider w-52">User</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider w-44">Waktu</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider w-40">Aktivitas</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Detail Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span>Memuat log audit...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-400 text-sm">
                    Tidak ada aktivitas log audit yang tercatat.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => {
                  const config = activityConfig[log.aktivitas];
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors animate-fade-in">
                      {/* User */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full ${log.user.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden`}>
                            {log.user.photo ? (
                              <span className="text-sm">{log.user.avatar}</span>
                            ) : (
                              <span>{log.user.avatar}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm leading-tight">{log.user.nama}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{log.user.jabatan}</p>
                          </div>
                        </div>
                      </td>

                      {/* Waktu */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-800">{log.tanggal}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{log.waktu}</p>
                      </td>

                      {/* Aktivitas Badge */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${config.bg} ${config.text}`}>
                          {config.icon}
                          {config.label}
                        </span>
                      </td>

                      {/* Detail */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-gray-900">{log.detail_utama}</p>
                        {log.nilai_lama && (
                          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                            <span className="line-through text-gray-400">{log.nilai_lama}</span>
                            <span className="text-gray-400">→</span>
                            <span className="text-blue-600 font-bold">{log.nilai_baru}</span>
                          </p>
                        )}
                        {log.detail_sub && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {log.detail_sub}{" "}
                            {log.status_text && (
                              <span className={`font-semibold ${log.status_color}`}>{log.status_text}</span>
                            )}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-white">
            <span className="text-sm text-gray-500">Menampilkan 1-{filtered.length} dari {totalItems} data</span>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
                <ChevronLeft size={15} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
