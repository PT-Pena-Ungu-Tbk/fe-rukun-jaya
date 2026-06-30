"use client";

import { useState, useEffect } from "react";
import TopNav from "@/components/layout/TopNav";
import { Download, Calendar, Pencil, Trash2, LogIn, LogOut, RotateCcw, ChevronLeft, ChevronRight, Loader2, Plus } from "lucide-react";
import { auditApi } from "@/lib/api";
import apiClient from "@/lib/axios";
import toast from "react-hot-toast";

interface AuditEntry {
  id: string;
  user: {
    nama: string;
    jabatan: string;
    avatar: string;
    color: string;
  };
  tanggal: string;
  waktu: string;
  aktivitas: string;
  tableTarget: string;
  payload: any;
}

const activityConfig: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  "CREATE": { label: "Create", bg: "bg-green-100", text: "text-green-700", icon: <Plus size={11} /> },
  "UPDATE": { label: "Update", bg: "bg-amber-100", text: "text-amber-700", icon: <Pencil size={11} /> },
  "DELETE": { label: "Delete", bg: "bg-red-100", text: "text-red-700", icon: <Trash2 size={11} /> },
  "LOGIN":  { label: "Login",  bg: "bg-blue-100", text: "text-blue-700", icon: <LogIn size={11} /> },
  "LOGOUT": { label: "Logout", bg: "bg-gray-100",  text: "text-gray-600",  icon: <LogOut size={11} /> },
};

const generateMonthOptions = () => {
  const options = [];
  const now = new Date("2026-06-30T16:02:23+07:00");
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const label = `${monthNames[month]} ${year}`;
    
    const startStr = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    
    options.push({ label, startDate: startStr, endDate: endStr });
  }
  return options;
};

export default function AuditLogPage() {
  const monthOptions = generateMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]);
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    auditApi.getLogs({ startDate: selectedMonth.startDate, endDate: selectedMonth.endDate })
      .then((res) => {
        const items = res.data ?? [];
        const mapped: AuditEntry[] = items.map((raw: any, idx: number) => {
          const userName = raw.user_name || raw.user_id || "User";
          const tableTarget = raw.table_name ? `${raw.table_name} (#${raw.record_id || ""})` : "-";
          return {
            id: String(raw.id || idx),
            user: {
              nama: userName,
              jabatan: raw.role || "Staff",
              avatar: userName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
              color: ["bg-purple-400", "bg-blue-600", "bg-gray-400", "bg-green-500"][idx % 4],
            },
            tanggal: new Date(raw.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
            waktu: new Date(raw.created_at).toLocaleTimeString("id-ID") + " WIB",
            aktivitas: raw.action || "LOGIN",
            tableTarget,
            payload: raw.changes_payload,
          };
        });
        setLogs(mapped);
        setTotalItems(items.length);
      })
      .catch((err) => {
        console.error(err);
        setLogs([]);
        setTotalItems(0);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedMonth]);

  const renderChangesPayload = (payload: any) => {
    if (!payload) return <span className="text-gray-400">-</span>;
    try {
      const data = typeof payload === "string" ? JSON.parse(payload) : payload;
      
      if (data && (data.old !== undefined || data.new !== undefined)) {
        const keys = Object.keys({ ...data.old, ...data.new });
        return (
          <div className="space-y-1 text-xs">
            {keys.map((key) => {
              const oldVal = data.old?.[key];
              const newVal = data.new?.[key];
              if (oldVal === newVal) return null;
              return (
                <div key={key} className="flex flex-wrap gap-1.5 items-center">
                  <span className="font-semibold text-gray-600">{key}:</span>
                  <span className="line-through text-gray-400 bg-red-50 px-1 rounded">{JSON.stringify(oldVal)}</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-blue-600 font-medium bg-blue-50 px-1 rounded">{JSON.stringify(newVal)}</span>
                </div>
              );
            })}
          </div>
        );
      }
      
      return (
        <pre className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded max-w-full overflow-x-auto whitespace-pre-wrap break-all">
          {JSON.stringify(data, null, 2)}
        </pre>
      );
    } catch (err) {
      return <span className="text-gray-600">{String(payload)}</span>;
    }
  };

  const handleExport = async () => {
    try {
      toast.loading("Mengunduh audit log...", { id: "export-audit" });
      const response = await apiClient.get("/audit/logs/export/excel", {
        responseType: "blob",
        params: {
          startDate: selectedMonth.startDate,
          endDate: selectedMonth.endDate
        }
      });
      const blob = new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Export_AuditLog_${selectedMonth.label.replace(" ", "_")}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Audit log berhasil diekspor!", { id: "export-audit" });
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengekspor audit log", { id: "export-audit" });
    }
  };

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
          {/* Dropdown Perbulan */}
          <div className="w-64">
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Pilih Bulan</label>
            <div className="relative">
              <select
                value={selectedMonth.label}
                onChange={(e) => {
                  const opt = monthOptions.find(o => o.label === e.target.value);
                  if (opt) setSelectedMonth(opt);
                }}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white font-medium"
              >
                {monthOptions.map((opt) => (
                  <option key={opt.label} value={opt.label}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▾</span>
            </div>
          </div>

          {/* Spacer + Export */}
          <div className="ml-auto">
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-colors font-semibold shadow-sm">
              <Download size={14} /> Ekspor Excel
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-slide-up stagger-2">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider w-[18%]">Pengguna</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider w-[17%]">Waktu</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider w-[12%]">Aktivitas</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider w-[15%]">Tabel Target</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider w-[38%]">Detail Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span>Memuat log audit...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400 text-sm">
                    Tidak ada aktivitas log audit yang tercatat pada bulan ini.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const config = activityConfig[log.aktivitas] || { label: log.aktivitas, bg: "bg-gray-100", text: "text-gray-600", icon: null };
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors animate-fade-in align-top">
                      {/* User */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full ${log.user.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden`}>
                            <span>{log.user.avatar}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{log.user.nama}</p>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{log.user.jabatan}</p>
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

                      {/* Tabel Target */}
                      <td className="px-5 py-4 text-sm font-mono text-gray-600 break-all">
                        {log.tableTarget}
                      </td>

                      {/* Detail Perubahan */}
                      <td className="px-5 py-4">
                        {renderChangesPayload(log.payload)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-white">
            <span className="text-sm text-gray-500">Menampilkan 1-{logs.length} dari {totalItems} data</span>
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
