"use client";

import { useState, useEffect } from "react";
import TopNav from "@/components/layout/TopNav";
import { Download, Calendar, Pencil, Trash2, LogIn, LogOut, RotateCcw, ChevronLeft, ChevronRight, Loader2, Plus, Eye, X } from "lucide-react";
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
  const now = new Date();
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  
  for (let i = 0; i < 24; i++) {
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
  const monthOptions = [
    { label: "Semua", startDate: undefined, endDate: undefined },
    ...generateMonthOptions()
  ];
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]);
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [detailLog, setDetailLog] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

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

  // Fetch log details on selectedLogId change
  useEffect(() => {
    if (!selectedLogId) {
      setDetailLog(null);
      return;
    }
    
    setLoadingDetail(true);
    auditApi.getLogDetail(selectedLogId)
      .then((res) => {
        setDetailLog(res.data);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Gagal memuat detail log audit.");
        setSelectedLogId(null);
      })
      .finally(() => {
        setLoadingDetail(false);
      });
  }, [selectedLogId]);

  const renderChangesSummary = (log: AuditEntry) => {
    if (log.aktivitas === "LOGIN") {
      return (
        <div className="flex flex-col items-start gap-1">
          <span className="text-xs text-gray-500 font-medium">Sesi login pengguna dimulai</span>
        </div>
      );
    }
    if (log.aktivitas === "LOGOUT") {
      return (
        <div className="flex flex-col items-start gap-1">
          <span className="text-xs text-gray-500 font-medium">Sesi login pengguna berakhir</span>
        </div>
      );
    }

    if (!log.payload) {
      return <span className="text-gray-400 text-xs">-</span>;
    }

    try {
      const data = typeof log.payload === "string" ? JSON.parse(log.payload) : log.payload;
      let summaryText = "Melakukan perubahan data";

      if (data && (data.old !== undefined || data.new !== undefined)) {
        const keys = Object.keys({ ...data.old, ...data.new }).filter(
          (key) => JSON.stringify(data.old?.[key]) !== JSON.stringify(data.new?.[key])
        );
        if (keys.length > 0) {
          summaryText = `Mengubah ${keys.length} kolom: ${keys.join(", ")}`;
        } else {
          summaryText = "Menyimpan data tanpa perubahan";
        }
      } else if (log.aktivitas === "CREATE") {
        summaryText = "Membuat data baru";
      } else if (log.aktivitas === "DELETE") {
        summaryText = "Menghapus data";
      } else if (data) {
        const keys = Object.keys(data);
        if (keys.length > 0) {
          summaryText = `Data perubahan: ${keys.slice(0, 3).join(", ")}${keys.length > 3 ? "..." : ""}`;
        }
      }

      return (
        <div className="flex flex-col items-start gap-1.5 max-w-full">
          <span className="text-xs text-gray-600 font-medium truncate max-w-full block" title={summaryText}>
            {summaryText}
          </span>
          <button
            onClick={() => setSelectedLogId(log.id)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-[11px] text-blue-600 hover:bg-blue-100 hover:text-blue-700 font-semibold transition-colors duration-150 border border-blue-100/50 cursor-pointer"
          >
            <Eye size={11} />
            <span>Lihat Detail</span>
          </button>
        </div>
      );
    } catch (err) {
      return (
        <div className="flex flex-col items-start gap-1.5">
          <span className="text-xs text-gray-600 font-medium truncate max-w-xs block">
            {String(log.payload)}
          </span>
          <button
            onClick={() => setSelectedLogId(log.id)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-[11px] text-blue-600 hover:bg-blue-100 hover:text-blue-700 font-semibold transition-colors duration-150 border border-blue-100/50 cursor-pointer"
          >
            <Eye size={11} />
            <span>Lihat Detail</span>
          </button>
        </div>
      );
    }
  };

  const renderDetailChanges = (payload: any) => {
    if (!payload) return <div className="p-4 text-center text-xs text-gray-400">Tidak ada detail perubahan data.</div>;
    
    try {
      const data = typeof payload === "string" ? JSON.parse(payload) : payload;
      
      if (data && (data.old !== undefined || data.new !== undefined)) {
        const keys = Object.keys({ ...data.old, ...data.new });
        const changedKeys = keys.filter(key => JSON.stringify(data.old?.[key]) !== JSON.stringify(data.new?.[key]));
        
        if (changedKeys.length === 0) {
          return (
            <div className="p-4 text-center text-xs text-gray-500">
              Data disimpan tanpa ada perubahan pada kolom.
            </div>
          );
        }

        return (
          <div className="divide-y divide-gray-100">
            <div className="grid grid-cols-3 bg-gray-50 px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <div>Nama Kolom</div>
              <div>Sebelum (Old)</div>
              <div>Sesudah (New)</div>
            </div>
            {changedKeys.map((key) => {
              const oldVal = data.old?.[key];
              const newVal = data.new?.[key];
              
              return (
                <div key={key} className="grid grid-cols-3 px-4 py-3 text-xs items-center hover:bg-gray-50/50 transition-colors">
                  <div className="font-semibold text-gray-700 break-all pr-2">{key}</div>
                  <div className="break-all pr-2">
                    {oldVal !== undefined ? (
                      <span className="inline-block bg-red-50 text-red-700 border border-red-100 rounded px-2 py-1 font-mono text-[11px]">
                        {typeof oldVal === "object" ? JSON.stringify(oldVal) : String(oldVal)}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">kosong</span>
                    )}
                  </div>
                  <div className="break-all">
                    {newVal !== undefined ? (
                      <span className="inline-block bg-green-50 text-green-700 border border-green-100 rounded px-2 py-1 font-mono text-[11px]">
                        {typeof newVal === "object" ? JSON.stringify(newVal) : String(newVal)}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">dihapus</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      return (
        <div className="p-4 bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto whitespace-pre rounded-b-xl max-h-[300px]">
          <code>{JSON.stringify(data, null, 2)}</code>
        </div>
      );
    } catch (err) {
      return (
        <div className="p-4 font-mono text-xs text-gray-700 break-all bg-gray-50">
          {String(payload)}
        </div>
      );
    }
  };

  const handleExport = async () => {
    if (!selectedMonth.startDate || !selectedMonth.endDate) {
      toast.error("Silakan pilih bulan tertentu terlebih dahulu untuk mengekspor data Excel.", { id: "export-audit" });
      return;
    }
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
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white font-medium cursor-pointer"
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
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-colors font-semibold shadow-sm cursor-pointer">
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
                    Tidak ada aktivitas log audit yang tercatat.
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
                        {renderChangesSummary(log)}
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

      {/* Modal Detail Log Audit */}
      {selectedLogId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] animate-scale-up overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                  <Calendar size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Detail Log Audit</h3>
                  <p className="text-xs text-gray-500">Informasi lengkap aktivitas dan perubahan sistem</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLogId(null)} 
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingDetail ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-500 font-medium">Memuat detail log...</span>
                </div>
              ) : detailLog ? (
                <>
                  {/* Grid Metadata */}
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Aktor / User ID</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{detailLog.user_id}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Waktu Aktivitas</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">
                        {new Date(detailLog.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}{" "}
                        {new Date(detailLog.created_at).toLocaleTimeString("id-ID")} WIB
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Aktivitas</p>
                      <div className="mt-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                          activityConfig[detailLog.action]?.bg || "bg-gray-100"
                        } ${
                          activityConfig[detailLog.action]?.text || "text-gray-700"
                        }`}>
                          {detailLog.action}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tabel / Target</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">
                        {detailLog.table_name || "-"} {detailLog.record_id ? `(#${detailLog.record_id})` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Changes Payload Section */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Detail Perubahan Data</h4>
                    <div className="border border-gray-205 rounded-xl overflow-hidden bg-white shadow-sm">
                      {renderDetailChanges(detailLog.changes_payload)}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Gagal memuat detail log audit.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <button 
                onClick={() => setSelectedLogId(null)} 
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
