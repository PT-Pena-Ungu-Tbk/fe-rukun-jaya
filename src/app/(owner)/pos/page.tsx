"use client";

import { useState, useEffect, useCallback } from "react";
import TopNav from "@/components/layout/TopNav";
import { Search, Minus, Plus, Trash2, X, CheckCircle, Printer, Download, ShoppingCart, Loader2 } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import toast from "react-hot-toast";
import { inventoryApi, membersApi, transactionsApi } from "@/lib/api";
import type { Product } from "@/types";

interface CartItem { product: Product; qty: number; }

const filterTabs = ["Semua", "Nama", "SKU", "Rak"];
const paymentMethods = ["CASH"] as const;

export default function POSPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [vipPhone, setVipPhone] = useState("");
  const [vipMember, setVipMember] = useState<{ nama: string; level: string; poin: number } | null>(null);
  const [discountType, setDiscountType] = useState<"%" | "Rp">("%");
  const [discountValue, setDiscountValue] = useState(0);
  const [cashPaid, setCashPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"CASH">("CASH");
  const [showReceipt, setShowReceipt] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [trxId, setTrxId] = useState(`TRX-${Math.floor(88000 + Math.random() * 999)}`);
  const [checking, setChecking] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Fetch products from API (debounced)
  const fetchProducts = useCallback(async (q: string, filter: string) => {
    setLoadingProducts(true);
    try {
      const isRackFilter = filter === "Rak";
      const result = await transactionsApi.searchProducts({
        search: isRackFilter ? undefined : (q || undefined),
        limit: 1000,
      });
      setProducts(result.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat produk dari API");
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(search, activeFilter), 350);
    return () => clearTimeout(timer);
  }, [search, activeFilter, fetchProducts]);

  const filtered = products.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    if (activeFilter === "SKU") return p.sku_code.toLowerCase().includes(s);
    if (activeFilter === "Rak") return (p.rack_location ?? "").toLowerCase().includes(s);
    if (activeFilter === "Nama") return p.name.toLowerCase().includes(s);
    return (
      p.name.toLowerCase().includes(s) ||
      p.sku_code.toLowerCase().includes(s) ||
      (p.rack_location ?? "").toLowerCase().includes(s)
    );
  });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const ex = prev.find((c) => c.product.id === product.id);
      if (ex) return prev.map((c) => c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((c) => c.product.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c).filter((c) => c.qty > 0));
  };

  const removeFromCart = (id: string) => setCart((prev) => prev.filter((c) => c.product.id !== id));

  const subtotal = cart.reduce((s, c) => s + Number(c.product.sell_price) * c.qty, 0);
  const discountAmt = discountType === "%" ? subtotal * (discountValue / 100) : discountValue;
  const ppn = (subtotal - discountAmt) * 0.11;
  const grandTotal = subtotal - discountAmt + ppn;
  const change = cashPaid - grandTotal;

  const validateVIP = async () => {
    if (!vipPhone) return;
    setChecking(true);
    try {
      const result = await membersApi.verifyMember(vipPhone);
      if (result.data) {
        setVipMember({ nama: result.data.name, level: result.data.level ?? "Gold", poin: result.data.points ?? 0 });
        toast.success(`Member VIP ditemukan: ${result.data.name}`);
      } else {
        toast.error("Nomor tidak terdaftar sebagai member VIP");
      }
    } catch {
      toast.error("Nomor tidak terdaftar sebagai member VIP");
    } finally {
      setChecking(false);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error("Keranjang kosong"); return; }
    if (paymentMethod === "CASH" && cashPaid < grandTotal) { toast.error("Jumlah bayar kurang"); return; }
    setProcessing(true);
    try {
      const result = await transactionsApi.checkout({
        member_id: vipMember ? vipPhone : null,
        discount_type: discountType === "%" ? "PERCENTAGE" : "NOMINAL",
        discount_value: discountValue,
        cash_paid: cashPaid,
        payment_method: paymentMethod,
        items: cart.map((c) => ({ product_id: c.product.id, quantity: c.qty })),
      });
      if (result.data?.transaction_id || result.data?.invoice_no) setTrxId(result.data.transaction_id ?? result.data.invoice_no ?? trxId);
      setShowReceipt(true);
      fetchProducts(search, activeFilter);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "Transaksi gagal diproses");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelTransaction = () => {
    setCart([]);
    setVipPhone("");
    setVipMember(null);
    setDiscountValue(0);
    setCashPaid(0);
    toast.success("Transaksi dibatalkan");
  };

  const printReceipt = () => {
    const printWindow = window.open("", "_blank", "width=600,height=600");
    if (!printWindow) {
      toast.error("Gagal membuka jendela cetak. Pastikan pop-up diizinkan.");
      return;
    }

    const dateStr = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    const itemsHtml = cart.map(item => `
      <tr>
        <td style="padding: 4px 0;">${item.product.name}<br/><span style="font-size: 10px; color: #666;">${item.qty} x ${formatRupiah(Number(item.product.sell_price))}</span></td>
        <td style="text-align: right; padding: 4px 0; vertical-align: bottom;">${formatRupiah(Number(item.product.sell_price) * item.qty)}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Struk Belanja - Toko Rukun Jaya</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; width: 300px; margin: 0 auto; padding: 20px; font-size: 12px; color: #000; }
            .text-center { text-align: center; }
            .bold { font-weight: bold; }
            .header { margin-bottom: 15px; }
            .header h2 { margin: 0 0 5px 0; font-size: 16px; }
            .header p { margin: 2px 0; font-size: 11px; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; }
            .totals td { padding: 2px 0; }
            .footer { margin-top: 20px; font-size: 10px; }
            @media print {
              body { margin: 0; padding: 10px; }
              @page { size: auto; margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header text-center">
            <h2>TOKO RUKUN JAYA</h2>
            <p>Jl. Raya Trans Sumatera, Lampung</p>
            <p>Telp: 0811-2233-4455</p>
          </div>
          <div class="divider"></div>
          <div>
            <p>Invoice : <span class="bold">${trxId}</span></p>
            <p>Tanggal : ${dateStr}</p>
            <p>Pelanggan: ${vipMember?.nama || "Umum"}</p>
          </div>
          <div class="divider"></div>
          <table>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="divider"></div>
          <table class="totals">
            <tbody>
              <tr><td>Subtotal</td><td style="text-align: right;">${formatRupiah(subtotal)}</td></tr>
              <tr><td>Diskon</td><td style="text-align: right;">-${formatRupiah(discountAmt)}</td></tr>
              <tr><td>PPN (11%)</td><td style="text-align: right;">${formatRupiah(ppn)}</td></tr>
              <tr class="bold" style="font-size: 13px;"><td>TOTAL</td><td style="text-align: right;">${formatRupiah(grandTotal)}</td></tr>
              <tr><td>Bayar</td><td style="text-align: right;">${formatRupiah(cashPaid || grandTotal)}</td></tr>
              <tr><td>Kembali</td><td style="text-align: right;">${formatRupiah(Math.max(0, (cashPaid || grandTotal) - grandTotal))}</td></tr>
            </tbody>
          </table>
          <div class="divider"></div>
          <div class="footer text-center">
            <p class="bold">TERIMA KASIH</p>
            <p>Atas Kunjungan Anda</p>
            <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const resetTransaction = () => {
    setCart([]); setVipPhone(""); setVipMember(null);
    setDiscountValue(0); setCashPaid(0);
    setShowReceipt(false); setShowDetail(false);
    setTrxId(`TRX-${Math.floor(88000 + Math.random() * 999)}`);
    toast.success("Transaksi baru dimulai");
    fetchProducts(search, activeFilter);
  };

  const statusBadge = (s: string) => {
    if (s === "LOW_STOCK") return <span className="badge-warning">Low Stock</span>;
    if (s === "OUT_OF_STOCK") return <span className="badge-danger">Out of Stock</span>;
    return <span className="badge-success">In Stock</span>;
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopNav />
      <main className="flex-1 p-4 animate-fade-in">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">Menu Penjualan / Transaksi</h1>
          <p className="text-sm text-gray-500">Kelola penjualan anda secara detail</p>
        </div>

        <div className="flex gap-4 h-[calc(100vh-160px)]">
          {/* Left: Product List */}
          <div className="flex-1 flex flex-col page-card overflow-hidden">
            {/* Search + Filter */}
            <div className="flex items-center gap-2 p-4 border-b border-gray-100">
              {filterTabs.map((t) => (
                <button key={t} onClick={() => setActiveFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeFilter === t ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  {t}
                </button>
              ))}
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari..." className="form-input pl-9 py-1.5 text-sm" />
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nama Barang</th><th>Kode SKU</th><th>Rak</th><th>Stok</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingProducts ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="animate-spin text-blue-600" size={20} />
                          <span className="text-xs text-gray-500">Memuat produk...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-xs text-gray-400">
                        Produk tidak ditemukan atau belum tersedia.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => (
                      <tr key={p.id} onClick={() => addToCart(p)} className="cursor-pointer">
                        <td className="text-blue-600 font-medium">{p.name}</td>
                        <td className="font-mono text-xs text-gray-500">{p.sku_code}</td>
                        <td className="text-gray-500 text-xs">{p.rack_location ?? "-"}</td>
                        <td className={`font-semibold ${p.current_stock < p.min_stock ? "text-amber-600" : "text-gray-800"}`}>{p.current_stock.toLocaleString("id-ID")}</td>
                        <td>{statusBadge(p.current_stock === 0 ? "OUT_OF_STOCK" : p.current_stock <= p.min_stock ? "LOW_STOCK" : "IN_STOCK")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Cart */}
          <div className="w-80 flex flex-col page-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <ShoppingCart size={16} /> Pesanan Saat Ini
              </h3>
              {cart.length > 0 && (
                <button onClick={handleCancelTransaction} className="text-xs text-red-500 hover:underline">Hapus Semua</button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Cart items */}
              <div className="p-3 space-y-2 border-b border-gray-100">
                {cart.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-4">Klik produk untuk menambah</p>
                ) : (
                  cart.map((item) => (
                    <div key={item.product.id} className="flex items-start justify-between gap-2 animate-fade-in">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-400">{formatRupiah(Number(item.product.sell_price))}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => updateQty(item.product.id, -1)} className="w-5 h-5 flex items-center justify-center border border-gray-200 rounded text-gray-500 hover:bg-gray-100"><Minus size={10} /></button>
                        <span className="w-7 text-center text-sm font-semibold">{item.qty}</span>
                        <button onClick={() => updateQty(item.product.id, 1)} className="w-5 h-5 flex items-center justify-center border border-gray-200 rounded text-gray-500 hover:bg-gray-100"><Plus size={10} /></button>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-gray-800">{formatRupiah(Number(item.product.sell_price) * item.qty)}</p>
                        <button onClick={() => removeFromCart(item.product.id)} className="text-xs text-red-400 hover:underline">Hapus</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* VIP */}
              <div className="p-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-600 mb-2">Member VIP</p>
                <div className="flex gap-2">
                  <input value={vipPhone} onChange={(e) => setVipPhone(e.target.value)}
                    placeholder="Nomor Telepon" className="form-input text-xs py-1.5 flex-1" />
                  <button onClick={validateVIP} disabled={checking}
                    className="btn-secondary text-xs py-1.5 px-3 flex-shrink-0">
                    {checking ? <Loader2 size={12} className="animate-spin" /> : "Validasi"}
                  </button>
                </div>
                {vipMember && (
                  <div className="mt-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
                    ✓ {vipMember.nama} · {vipMember.level} · {vipMember.poin} poin
                  </div>
                )}
              </div>

              {/* Discount */}
              <div className="p-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-600 mb-2">Diskon</p>
                <div className="flex gap-2">
                  <select value={discountType} onChange={(e) => setDiscountType(e.target.value as "%" | "Rp")}
                    className="form-select text-xs py-1.5 w-20">
                    <option>%</option><option>Rp</option>
                  </select>
                  <input type="number" value={discountValue || ""} onChange={(e) => setDiscountValue(+e.target.value)}
                    placeholder="Jumlah" className="form-input text-xs py-1.5 flex-1" />
                </div>
              </div>

              {/* Payment Method */}
              <div className="p-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-600 mb-2">Metode Pembayaran</p>
                <div className="w-full py-2 text-center text-xs font-bold rounded-lg bg-green-50 text-green-700 border border-green-200">
                  💵 Tunai (Cash Only)
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="space-y-1.5 text-sm mb-3">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Diskon</span><span>- {formatRupiah(discountAmt)}</span></div>
                <div className="flex justify-between text-gray-600"><span>PPN (11%)</span><span>{formatRupiah(ppn)}</span></div>
                <div className="flex justify-between font-bold text-lg text-blue-700 pt-2 border-t border-gray-200">
                  <span>Total</span><span>{formatRupiah(grandTotal)}</span>
                </div>
              </div>

              {paymentMethod === "CASH" && (
                <div className="mb-3">
                  <label className="form-label text-xs">Jumlah Pembayaran</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                    <input type="number" value={cashPaid || ""} onChange={(e) => setCashPaid(+e.target.value)}
                      className="form-input pl-9 text-right font-semibold" />
                  </div>
                  {cashPaid > 0 && (
                    <div className="flex justify-between text-sm mt-1.5 text-gray-600">
                      <span>Kembalian</span>
                      <span className={`font-semibold ${change < 0 ? "text-red-600" : "text-gray-800"}`}>{formatRupiah(Math.max(0, change))}</span>
                    </div>
                  )}
                </div>
              )}

              <button onClick={handleCheckout} disabled={processing || cart.length === 0}
                className="btn-primary w-full justify-center py-2.5 text-sm">
                {processing ? <Loader2 size={15} className="animate-spin" /> : <><Printer size={15} /> Bayar & Cetak Struk</>}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Step 1: Payment Success Screen */}
      {showReceipt && !showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-overlay">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl modal-content mx-4 p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">Pembayaran Berhasil!</h3>
            <p className="text-sm text-gray-500 mb-1">Transaksi #{trxId} telah diproses.</p>
            <p className="text-xs text-gray-400 mb-6">{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}, {new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB</p>

            <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left space-y-1.5">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Grand Total</span><span className="font-bold text-blue-700 text-lg">{formatRupiah(grandTotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Metode</span><span className="font-medium text-gray-800">{paymentMethod === "CASH" ? "Tunai" : paymentMethod === "TRANSFER" ? "Transfer" : paymentMethod}</span></div>
              {paymentMethod === "CASH" && cashPaid > 0 && (
                <div className="flex justify-between text-sm"><span className="text-gray-500">Kembalian</span><span className="font-medium text-gray-800">{formatRupiah(Math.max(0, change))}</span></div>
              )}
            </div>

            <div className="space-y-2">
              <button onClick={() => setShowDetail(true)} className="btn-primary w-full justify-center py-2.5">
                <CheckCircle size={15} /> Lihat Detail Transaksi
              </button>
              <button onClick={printReceipt} className="btn-secondary w-full justify-center">
                <Printer size={15} /> Cetak Struk
              </button>
              <button onClick={resetTransaction} className="text-sm text-blue-600 hover:underline mt-1">
                ← Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Detail Transaksi Modal — matches Figma design */}
      {showReceipt && showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-overlay">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl modal-content mx-4">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                  <CheckCircle size={18} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Detail Transaksi - {trxId}</h3>
                  <p className="text-xs text-gray-500">{new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}, {new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="badge-success text-sm px-3 py-1">Lunas</span>
                <button onClick={resetTransaction} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Customer & Payment Info */}
            <div className="grid grid-cols-2 gap-4 px-6 py-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Informasi Pelanggan</p>
                <p className="font-bold text-gray-900">{vipMember?.nama ?? "Pelanggan Umum"}</p>
                {vipMember && <p className="text-sm text-gray-600 mt-0.5">Member {vipMember.level}</p>}
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Metode Pembayaran</p>
                <p className="font-bold text-gray-900">💵 Tunai</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="px-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 rounded-lg">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 rounded-l-lg">No</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Produk</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">SKU</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500">Qty</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Harga Satuan</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 rounded-r-lg">Total Harga</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((c, i) => (
                    <tr key={c.product.id} className="border-b border-gray-50">
                      <td className="py-2.5 px-3 text-gray-500">{i + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-gray-800">{c.product.name}</td>
                      <td className="py-2.5 px-3 font-mono text-xs text-gray-500">{c.product.sku_code}</td>
                      <td className="py-2.5 px-3 text-center text-gray-700">{c.qty}</td>
                      <td className="py-2.5 px-3 text-right text-gray-700">{formatRupiah(Number(c.product.sell_price))}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-gray-900">{formatRupiah(Number(c.product.sell_price) * c.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="px-6 py-4">
              <div className="flex flex-col items-end gap-1.5 text-sm text-gray-600">
                <div className="flex justify-between w-64"><span>Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
                <div className="flex justify-between w-64"><span>Diskon (Member)</span><span className="text-red-500">- {formatRupiah(discountAmt)}</span></div>
                <div className="flex justify-between w-64"><span>PPN 11%</span><span>{formatRupiah(ppn)}</span></div>
                <div className="flex justify-between w-64 pt-2 border-t border-gray-200 mt-1">
                  <span className="font-bold text-gray-800">Grand Total</span>
                  <span className="text-2xl font-bold text-blue-700">{formatRupiah(grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={resetTransaction} className="btn-secondary">
                <X size={14} /> Tutup
              </button>
              <button onClick={printReceipt} className="btn-secondary">
                <Download size={14} /> Ekspor PDF
              </button>
              <button onClick={printReceipt} className="btn-primary">
                <Printer size={14} /> Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
