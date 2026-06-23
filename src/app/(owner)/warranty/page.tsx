"use client";

import { useState } from "react";
import TopNav from "@/components/layout/TopNav";
import { RotateCcw, Loader2, FileText, Package } from "lucide-react";
import toast from "react-hot-toast";
import { transactionsApi } from "@/lib/api";

export default function WarrantyPage() {
  const [transactionId, setTransactionId] = useState("");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRetur = async () => {
    if (!transactionId || !productId) {
      toast.error("ID Transaksi dan ID Produk wajib diisi");
      return;
    }
    setSubmitting(true);
    try {
      await transactionsApi.returnProduct({
        transaction_id: transactionId,
        product_id: productId,
        quantity_returned: qty,
      });
      toast.success("Retur berhasil diproses!");
      setSuccess(true);
      setTransactionId("");
      setProductId("");
      setQty(1);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Gagal memproses retur");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopNav />
      <main className="flex-1 p-6 animate-fade-in">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Klaim Garansi & Retur</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Proses pengembalian barang cacat dari transaksi yang sudah ada.
          </p>
        </div>

        {success && (
          <div className="mb-4 px-5 py-4 bg-green-50 border border-green-200 rounded-2xl text-green-700 text-sm font-medium animate-fade-in">
            ✓ Retur berhasil diproses dan stok telah diperbarui.
          </div>
        )}

        <div className="max-w-lg bg-white border border-gray-200 rounded-2xl shadow-sm p-6 animate-slide-up">
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <RotateCcw size={16} className="text-blue-600" />
            Form Retur Barang
          </h2>

          <div className="space-y-4">
            <div>
              <label className="form-label">ID Transaksi *</label>
              <div className="relative">
                <FileText size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="uuid transaksi"
                  className="form-input pl-9 font-mono text-sm"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">UUID transaksi penjualan asli</p>
            </div>

            <div>
              <label className="form-label">ID Produk *</label>
              <div className="relative">
                <Package size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  placeholder="uuid produk"
                  className="form-input pl-9 font-mono text-sm"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">UUID produk yang akan diretur</p>
            </div>

            <div>
              <label className="form-label">Jumlah Retur *</label>
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(Math.max(1, +e.target.value))}
                min={1}
                className="form-input"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleRetur}
              disabled={submitting}
              className="btn-primary gap-2"
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
              Proses Retur
            </button>
          </div>
        </div>

        {/* Info card */}
        <div className="max-w-lg mt-4 px-5 py-4 bg-blue-50 border border-blue-100 rounded-2xl text-sm text-blue-700 animate-slide-up stagger-2">
          <p className="font-semibold mb-1">Cara menggunakan:</p>
          <ol className="list-decimal list-inside space-y-1 text-blue-600">
            <li>Cari ID Transaksi dari halaman Laporan / Transaksi</li>
            <li>Masukkan ID Produk yang ingin diretur</li>
            <li>Tentukan jumlah unit yang dikembalikan</li>
            <li>Klik &quot;Proses Retur&quot; — stok otomatis bertambah kembali</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
