"use client";

import { useState } from "react";
import TopNav from "@/components/layout/TopNav";
import { RotateCcw, Loader2, FileText, Search, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { transactionsApi } from "@/lib/api";

type InvoiceItem = {
  kode_item: string;
  nama_barang: string;
  qty_beli: number;
  qty_sudah_diretur: number;
  harga_satuan: number;
  can_return: boolean;
};

type InvoiceData = {
  nota_id: string;
  tanggal: string;
  items: InvoiceItem[];
};

export default function WarrantyPage() {
  // Step 1: Lookup
  const [transactionId, setTransactionId] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);

  // Step 2: Return form
  const [selectedItem, setSelectedItem] = useState<InvoiceItem | null>(null);
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState("CACAT_PABRIK");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleLookup = async () => {
    if (!transactionId.trim()) {
      toast.error("Silakan masukkan No. Invoice");
      return;
    }
    setLookingUp(true);
    try {
      const res = await transactionsApi.lookupWarranty(transactionId.trim());
      setInvoiceData(res);
      setSelectedItem(null);
      setSuccess(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Gagal menemukan data transaksi");
      setInvoiceData(null);
    } finally {
      setLookingUp(false);
    }
  };

  const handleSelectItem = (item: InvoiceItem) => {
    if (!item.can_return) return;
    setSelectedItem(item);
    setQty(1);
    setSuccess(false);
  };

  const handleRetur = async () => {
    if (!invoiceData || !selectedItem) {
      return;
    }
    setSubmitting(true);
    try {
      await transactionsApi.returnProduct({
        invoice_no: invoiceData.nota_id,
        product_id: selectedItem.kode_item,
        qty: qty,
        reason: reason,
      });
      toast.success("Retur berhasil diproses!");
      setSuccess(true);
      
      // Refresh invoice data to show updated returning limits
      handleLookup();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Gagal memproses retur");
    } finally {
      setSubmitting(false);
    }
  };

  const maxQty = selectedItem ? (selectedItem.qty_beli - selectedItem.qty_sudah_diretur) : 1;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopNav />
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full animate-fade-in">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Klaim Garansi & Retur</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Proses pengembalian barang cacat dengan mencari nomor faktur/invoice terlebih dahulu.
          </p>
        </div>

        {success && (
          <div className="mb-6 px-5 py-4 bg-green-50 border border-green-200 rounded-2xl text-green-700 flex gap-3 items-start animate-fade-in">
            <CheckCircle2 className="shrink-0 mt-0.5 text-green-600" size={18} />
            <div>
              <p className="font-semibold text-sm">Retur Berhasil</p>
              <p className="text-sm mt-0.5 opacity-90">Klaim garansi telah dicatat dan stok gudang otomatis diperbarui.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Lookup & Item List */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Search size={16} className="text-blue-600" />
                Cari Transaksi
              </h2>
              
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <FileText size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Contoh: INV-178301..."
                    className="form-input pl-9 font-mono text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                  />
                </div>
                <button
                  onClick={handleLookup}
                  disabled={lookingUp || !transactionId.trim()}
                  className="btn-primary whitespace-nowrap"
                >
                  {lookingUp ? <Loader2 size={16} className="animate-spin" /> : "Cari Nota"}
                </button>
              </div>
            </div>

            {invoiceData && (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 animate-slide-up">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h3 className="font-bold text-gray-800">Daftar Barang</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Pilih barang dari nota <span className="font-mono text-gray-700 font-semibold">{invoiceData.nota_id}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Tanggal Transaksi</p>
                    <p className="text-sm font-medium text-gray-700">
                      {new Date(invoiceData.tanggal).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {invoiceData.items.map((item, idx) => {
                    const isSelected = selectedItem?.kode_item === item.kode_item;
                    return (
                      <div 
                        key={idx}
                        onClick={() => handleSelectItem(item)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          !item.can_return 
                            ? "border-gray-100 bg-gray-50 cursor-not-allowed opacity-75"
                            : isSelected 
                              ? "border-blue-500 bg-blue-50 cursor-default" 
                              : "border-gray-100 hover:border-blue-200 hover:bg-slate-50 cursor-pointer"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-sm text-gray-900">{item.nama_barang}</p>
                            <p className="font-mono text-xs text-gray-500 mt-1">{item.kode_item}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              Rp {item.harga_satuan.toLocaleString("id-ID")}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                          <div className="flex gap-4">
                            <span className="text-gray-600">Beli: <strong className="text-gray-900">{item.qty_beli}</strong></span>
                            <span className="text-gray-600">Diretur: <strong className="text-orange-600">{item.qty_sudah_diretur}</strong></span>
                          </div>
                          
                          {!item.can_return ? (
                            <span className="text-red-500 font-medium flex items-center gap-1">
                              <AlertCircle size={12} /> Limit retur tercapai
                            </span>
                          ) : (
                            <span className="text-blue-600 font-medium">
                              Sisa retur: {item.qty_beli - item.qty_sudah_diretur}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Return Form */}
          <div className="lg:col-span-5">
            {!selectedItem ? (
              <div className="bg-gray-50/50 border border-gray-200 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-400 mb-4">
                  <ArrowLeft size={20} />
                </div>
                <h3 className="font-bold text-gray-700 text-sm">Pilih Barang Dulu</h3>
                <p className="text-xs text-gray-500 mt-2 max-w-[200px]">
                  Cari invoice dan klik salah satu barang di sebelah kiri untuk memproses klaim garansi.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sticky top-6 animate-slide-up">
                <h2 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2 pb-4 border-b border-gray-100">
                  <RotateCcw size={16} className="text-blue-600" />
                  Form Klaim Garansi
                </h2>

                <div className="mb-6 bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Barang Terpilih:</p>
                  <p className="font-bold text-sm text-slate-900">{selectedItem.nama_barang}</p>
                  <p className="font-mono text-xs text-slate-600 mt-1">{selectedItem.kode_item}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="form-label flex justify-between">
                      <span>Jumlah Diretur *</span>
                      <span className="text-xs font-normal text-gray-500">Maks: {maxQty}</span>
                    </label>
                    <input
                      type="number"
                      value={qty}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (isNaN(val)) setQty(1);
                        else setQty(Math.min(maxQty, Math.max(1, val)));
                      }}
                      min={1}
                      max={maxQty}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="form-label">Alasan Retur *</label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="form-select"
                    >
                      <option value="CACAT_PABRIK">Cacat Pabrik</option>
                      <option value="SALAH_KIRIM">Salah Kirim</option>
                      <option value="KUALITAS_TIDAK_SESUAI">Kualitas Tidak Sesuai</option>
                      <option value="LAINNYA">Lainnya</option>
                    </select>
                  </div>
                </div>

                <div className="mt-8 pt-5 border-t border-gray-100">
                  <button
                    onClick={handleRetur}
                    disabled={submitting || qty > maxQty || qty < 1}
                    className="btn-primary w-full gap-2 justify-center"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                    Proses Pengembalian
                  </button>
                  <button
                    onClick={() => setSelectedItem(null)}
                    disabled={submitting}
                    className="w-full mt-2 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
