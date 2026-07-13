"use client";

import { useEffect, useState } from "react";
import TopNav from "@/components/layout/TopNav";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Save, Filter, RefreshCw, Loader2, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { inventoryApi } from "@/lib/api";

interface BulkItem {
  item_id: string;
  nama_barang: string;
  stok_sistem: number;
  stok_fisik_baru: number;
  kode_rak: string;
  keterangan: string;
}

export default function BulkUpdatePage() {
  const router = useRouter();
  const [items, setItems] = useState<BulkItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    inventoryApi.getProducts()
      .then((res) => {
        if (res.data?.length) {
          setItems(res.data.map((p) => ({
            item_id: p.id,
            nama_barang: p.name,
            stok_sistem: p.current_stock,
            stok_fisik_baru: p.current_stock,
            kode_rak: p.rack_location ?? "",
            keterangan: "",
          })));
        } else {
          setItems([]);
        }
      })
      .catch(() => {
        setItems([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const updateField = (id: string, field: keyof BulkItem, value: string | number) => {
    setItems((prev) => prev.map((i) => i.item_id === id ? { ...i, [field]: value } : i));
  };

  const selisihSignifikan = items.filter((i) => Math.abs(i.stok_fisik_baru - i.stok_sistem) / (i.stok_sistem || 1) > 0.1).length;
  const stokMenipis = items.filter((i) => i.stok_fisik_baru < 20).length;

  const handleDownloadTemplate = async () => {
    try {
      toast.loading("Mengunduh template...", { id: "download-template" });
      const blob = await inventoryApi.downloadBulkUpdateTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Template_Bulk_Update_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Template berhasil diunduh!", { id: "download-template" });
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengunduh template Excel", { id: "download-template" });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await inventoryApi.bulkUpdateStock(items.map((item) => ({
        id: item.item_id,
        new_stock: item.stok_fisik_baru,
      })));
      toast.success(`${items.length} barang berhasil diperbarui!`);
      router.push("/inventory");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Gagal memperbarui stok");
    } finally {
      setSaving(false);
    }
  };

  const now = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopNav />
      <main className="flex-1 p-6 animate-fade-in">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <ChevronRight size={14} />
          <Link href="/inventory" className="hover:text-blue-600">Inventory</Link>
          <ChevronRight size={14} />
          <span className="text-gray-800 font-medium">Perbarui Sekaligus</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Update Stok Massal</h1>
            <p className="text-sm text-gray-500 mt-0.5">Sinkronisasi stok fisik gudang dengan sistem secara efisien.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDownloadTemplate} className="btn-secondary text-sm cursor-pointer"><Download size={14} /> Unduh Template Excel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm cursor-pointer">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Simpan Semua Perubahan
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-5 animate-slide-up">
          {[
            { label: "Total Item Dipilih", value: items.length, icon: RefreshCw, color: "blue" },
            { label: "Stok Menipis", value: stokMenipis, icon: Filter, color: "amber" },
            { label: "Selisih Signifikan", value: selisihSignifikan, icon: RefreshCw, color: "red" },
            { label: "Terakhir Update", value: now, icon: RefreshCw, color: "gray" },
          ].map((s, i) => (
            <div key={i} className={`stat-card stagger-${i + 1}`}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color === "blue" ? "text-blue-600" : s.color === "amber" ? "text-amber-600" : s.color === "red" ? "text-red-600" : "text-gray-700"}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="page-card animate-slide-up stagger-2">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Menampilkan 1-{items.length} dari {items.length} item</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors cursor-pointer">
                <Filter size={15} />
              </button>
              <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors cursor-pointer">
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th><input type="checkbox" className="rounded" /></th>
                  <th>ID Barang</th>
                  <th>Nama Barang</th>
                  <th>Stok Sistem</th>
                  <th>Stok Fisik Baru</th>
                  <th>Kode Rak</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        <span>Memuat data inventaris...</span>
                      </div>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-gray-400 text-sm">
                      Tidak ada barang di inventaris.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const selisih = item.stok_fisik_baru - item.stok_sistem;
                    return (
                      <tr key={item.item_id} className="animate-fade-in">
                        <td><input type="checkbox" className="rounded" /></td>
                        <td>
                          <Link href={`/inventory/${item.item_id}`} className="font-mono text-sm font-semibold text-blue-600 hover:underline">
                            {item.item_id}
                          </Link>
                        </td>
                        <td className="text-gray-800 font-medium">{item.nama_barang}</td>
                        <td className="text-gray-600">{item.stok_sistem.toLocaleString("id-ID")}</td>
                        <td>
                          <input
                            type="number"
                            value={item.stok_fisik_baru}
                            onChange={(e) => updateField(item.item_id, "stok_fisik_baru", +e.target.value)}
                            className={`w-24 px-2 py-1 text-sm font-bold border rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                              selisih !== 0 ? "border-blue-300 bg-blue-50 text-blue-800" : "border-gray-200"}`}
                          />
                          {selisih !== 0 && (
                            <span className={`ml-1 text-xs font-medium ${selisih > 0 ? "text-green-600" : "text-red-600"}`}>
                              {selisih > 0 ? "+" : ""}{selisih}
                            </span>
                          )}
                        </td>
                        <td>
                          <input
                            value={item.kode_rak}
                            onChange={(e) => updateField(item.item_id, "kode_rak", e.target.value)}
                            className="w-24 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td>
                          <input
                            value={item.keterangan}
                            onChange={(e) => updateField(item.item_id, "keterangan", e.target.value)}
                            className="w-40 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Sedang Diedit
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" /> Stok Sistem (Read-only)
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-500 mr-1">Halaman 1 dari 3</span>
              {["‹", "1", "2", "3", "›"].map((p, i) => (
                <button key={i} className={`w-7 h-7 rounded text-xs ${p === "1" ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-600"}`}>{p}</button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
