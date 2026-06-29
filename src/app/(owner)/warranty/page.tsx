"use client";

import { useState } from "react";
import TopNav from "@/components/layout/TopNav";
import { RotateCcw, Loader2, Search, Package } from "lucide-react";
import toast from "react-hot-toast";
import { warrantyApi } from "@/lib/api";
import { formatRupiah } from "@/lib/utils";

const REASONS = [
  { value: "CACAT_PABRIK",          label: "Cacat Pabrik" },
  { value: "SALAH_KIRIM",           label: "Salah Kirim" },
  { value: "KUALITAS_TIDAK_SESUAI", label: "Kualitas Tidak Sesuai" },
  { value: "LAINNYA",               label: "Lainnya" },
] as const;

type Reason = typeof REASONS[number]["value"];

interface TrxItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
}

interface TrxData {
  invoice_no: string;
  grand_total: number;
  created_at: string;
  items?: TrxItem[];
}

export default function WarrantyPage() {
  const [invoiceNo,  setInvoiceNo]  = useState("");
  const [looking,    setLooking]    = useState(false);
  const [trxData,    setTrxData]    = useState<TrxData | null>(null);

  const [productId,  setProductId]  = useState("");
  const [qty,        setQty]        = useState(1);
  const [reason,     setReason]     = useState<Reason>("CACAT_PABRIK");
  const [submitting, setSubmitting] = useState(false);

  const handleLookup = async () => {
    if (!invoiceNo.trim()) { toast.error("Masukkan No. Invoice"); return; }
    setLooking(true);
    setTrxData(null);
    try {
      const res = await warrantyApi.lookup(invoiceNo.trim());
      const d = (res as Record<string, unknown>).data ?? res;
      setTrxData(d as TrxData);
      toast.success("Transaksi ditemukan!");
    } catch (_e) {
      toast.error("Invoice tidak ditemukan");
    } finally {
      setLooking(false);
    }
  };

  const handleClaim = async () => {
    if (!invoiceNo || !productId) { toast.error("Invoice No dan Product ID wajib diisi"); return; }
    setSubmitting(true);
    try {
      await warrantyApi.claim({ invoice_no: invoiceNo, product_id: productId, qty, reason });
      toast.success("Klaim garansi berhasil diproses!");
      setInvoiceNo(""); setProductId(""); setQty(1); setReason("CACAT_PABRIK"); setTrxData(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Gagal memproses klaim");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopNav />
      <main className="flex-1 p-6 animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Klaim Garansi & Retur</h1>
          <p className="text-sm text-gray-500 mt-0.5">Cari transaksi berdasarkan No. Invoice, lalu proses klaim.</p>
        </div>

        <div className="max-w-xl space-y-4">
          {/* Step 1: Lookup */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 animate-slide-up">
            <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center">1</span>
              Cari Transaksi
            </h2>
            <div className="flex gap-2">
              <input
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                placeholder="Contoh: INV-1782540438646"
                className="form-input flex-1 font-mono text-sm"
              />
              <button onClick={handleLookup} disabled={looking} className="btn-primary px-4">
                {looking ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              </button>
            </div>

            {trxData && (
              <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-xl text-sm">
                <p className="font-semibold text-green-800">{trxData.invoice_no}</p>
                <p className="text-green-600 text-xs mt-0.5">
                  {trxData.created_at ? new Date(trxData.created_at).toLocaleString("id-ID") : ""} ·{" "}
                  {trxData.grand_total ? formatRupiah(Number(trxData.grand_total)) : ""}
                </p>
                {trxData.items && trxData.items.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {trxData.items.map((item) => (
                      <div key={item.product_id} className="flex justify-between text-xs text-green-700">
                        <span>{item.name} (x{item.quantity})</span>
                        <button
                          onClick={() => setProductId(item.product_id)}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          Pilih
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Claim form */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 animate-slide-up stagger-2">
            <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center">2</span>
              Detail Klaim
            </h2>
            <div className="space-y-3">
              <div>
                <label className="form-label">Product ID *</label>
                <div className="relative">
                  <Package size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    placeholder="UUID produk (atau klik Pilih di atas)"
                    className="form-input pl-9 font-mono text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Jumlah Retur *</label>
                  <input type="number" value={qty} onChange={(e) => setQty(Math.max(1, +e.target.value))}
                    min={1} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Alasan *</label>
                  <select value={reason} onChange={(e) => setReason(e.target.value as Reason)} className="form-select">
                    {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button onClick={handleClaim} disabled={submitting || !invoiceNo || !productId} className="btn-primary">
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
                Proses Klaim
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
