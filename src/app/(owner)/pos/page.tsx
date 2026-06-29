"use client";

import { useState, useEffect, useCallback } from "react";
import TopNav from "@/components/layout/TopNav";
import { Search, Minus, Plus, Trash2, X, CheckCircle, Printer, Download, ShoppingCart, Loader2 } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import toast from "react-hot-toast";
import { posApi, inventoryApi } from "@/lib/api";
import type { Product } from "@/types";

interface CartItem { product: Product; qty: number; }

const FALLBACK_PRODUCTS: Product[] = [
  { id: "INV-001", sku_code: "SKU-C-001", name: "Beras 5kg", category: "Sembako", supplier: "-", buy_price: "55000", sell_price: "65000", current_stock: 450, defective_stock: 0, min_stock: 20, rack_location: "R-A1-01" },
  { id: "INV-002", sku_code: "SKU-N-05C", name: "Paku Kayu 5cm", category: "Bangunan", supplier: "-", buy_price: "18000", sell_price: "22000", current_stock: 45, defective_stock: 0, min_stock: 20, rack_location: "R-C1-12" },
  { id: "INV-003", sku_code: "SKU-S-10M", name: "Minyak 1L", category: "Sembako", supplier: "-", buy_price: "26000", sell_price: "32000", current_stock: 1200, defective_stock: 0, min_stock: 50, rack_location: "R-B2-04" },
  { id: "INV-006", sku_code: "SKU-SMN-TR50", name: "Semen Tiga Roda 50kg", category: "Semen", supplier: "-", buy_price: "55000", sell_price: "65000", current_stock: 200, defective_stock: 0, min_stock: 30, rack_location: "R-A1-03" },
  { id: "INV-007", sku_code: "SKU-CAT-AV5", name: "Cat Tembok Avian 5kg", category: "Cat", supplier: "-", buy_price: "80000", sell_price: "95000", current_stock: 30, defective_stock: 0, min_stock: 10, rack_location: "R-B1-02" },
  { id: "INV-008", sku_code: "SKU-BSI-10", name: "Besi Beton 10mm", category: "Besi", supplier: "-", buy_price: "90000", sell_price: "105000", current_stock: 500, defective_stock: 0, min_stock: 50, rack_location: "R-C2-01" },
];

const filterTabs = ["Semua", "Nama", "SKU", "Rak"];

export default function POSPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [vipPhone, setVipPhone] = useState("");
  const [vipMember, setVipMember] = useState<{ id: string; nama: string; level: string; poin: number } | null>(null);
  const [discountType, setDiscountType] = useState<"%" | "Rp">("%");
  const [discountValue, setDiscountValue] = useState(0);
  const [cashPaid, setCashPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TRANSFER" | "QRIS" | "CREDIT">("CASH");
  const [showReceipt, setShowReceipt] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [trxId, setTrxId] = useState(`TRX-${Math.floor(88000 + Math.random() * 999)}`);
  const [checking, setChecking] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    invoice_no: string;
    status: string;
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    grand_total: number;
    cash_paid: number;
    change_amount: number;
    created_at: string;
    struk_url: string;
    vip_member: string | null;
    kasir_id: string;
    items: { product_id: string; nama: string; qty: number; harga_satuan: number; subtotal: number }[];
  } | null>(null);

  // Fetch products from API (debounced)
  const fetchProducts = useCallback(async (q: string) => {
    const searchFallback = async () => {
      const r2 = await inventoryApi.getProducts({ search: q || undefined });
      const p2 = r2 as Record<string, unknown>;
      const l2 = Array.isArray(p2.data) ? p2.data : [];
      if (l2.length > 0) {
        console.log("[POS] products dari /inventory:", l2.length, "item, ID[0]:", (l2[0] as Record<string,unknown>)?.id);
        setProducts(l2 as Product[]);
      } else {
        console.warn("[POS] API kosong, pakai FALLBACK (dummy data - checkout tidak bisa)");
      }
    };
    try {
      const result = await posApi.getProducts({ search: q || undefined });
      const payload = result as Record<string, unknown>;
      const list = Array.isArray(payload.data) ? payload.data : Array.isArray(result) ? result : [];
      if (list.length > 0) {
        console.log("[POS] products dari /pos/products:", list.length, "item, ID[0]:", (list[0] as Record<string,unknown>)?.id);
        setProducts(list as Product[]);
      } else {
        console.warn("[POS] /pos/products kosong, coba /inventory...");
        await searchFallback();
      }
    } catch (err) {
      console.error("[POS] gagal fetch /pos/products:", err);
      try { await searchFallback(); } catch (_e) { console.warn("[POS] fallback /inventory juga gagal, pakai dummy"); }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(search), 350);
    return () => clearTimeout(timer);
  }, [search, fetchProducts]);

  const filtered = products.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    if (activeFilter === "SKU") return p.sku_code.toLowerCase().includes(s);
    if (activeFilter === "Rak") return p.rack_location.toLowerCase().includes(s);
    return p.name.toLowerCase().includes(s) || p.sku_code.toLowerCase().includes(s);
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
      const result = await posApi.validateVip(vipPhone);
      const md = (result as Record<string, unknown>).data ?? result;
      const member = md as Record<string, unknown>;
      if (member) {
        setVipMember({
          id: String(member.id ?? member.member_id ?? ""),
          nama: String(member.name ?? member.nama ?? ""),
          level: String(member.level ?? "Regular"),
          poin: Number(member.points ?? member.poin ?? 0),
        });
        toast.success(`Member VIP ditemukan: ${member.name ?? member.nama}`);
      } else {
        toast.error("Nomor tidak terdaftar sebagai member VIP");
      }
    } catch (_e) {
      toast.error("Nomor tidak terdaftar sebagai member VIP");
    } finally {
      setChecking(false);
    }
  };

  const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error("Keranjang kosong"); return; }
    if (paymentMethod === "CASH" && cashPaid < grandTotal) { toast.error("Jumlah bayar kurang"); return; }

    const nonUUID = cart.find((c) => !isUUID(c.product.id));
    if (nonUUID) {
      toast.error(`Produk "${nonUUID.product.name}" belum sinkron dari server. Coba cari ulang produk.`);
      return;
    }

    setProcessing(true);
    try {
      const jumlahBayar = paymentMethod === "CASH" ? Math.round(cashPaid) : Math.round(grandTotal);
      const payload: Parameters<typeof posApi.checkout>[0] = {
        items: cart.map((c) => ({ product_id: c.product.id, qty: c.qty })),
        payment_method: paymentMethod as "CASH" | "QRIS" | "DEBIT" | "TRANSFER",
        jumlah_bayar: jumlahBayar,
        vip_phone: vipPhone || "",
        diskon_persen: discountType === "%" ? discountValue : 0,
        diskon_nominal: discountType === "Rp" ? Math.round(discountValue) : 0,
        nama_pelanggan: "",
        payment_reference: "",
      };
      console.log("[checkout] payload:", JSON.stringify(payload));
      const result = await posApi.checkout(payload);
      const rawResult = result as Record<string, unknown>;
      const d = (rawResult.data ?? result) as Record<string, unknown>;
      const invoiceNo = String(d?.transaction_id ?? trxId);
      if (d?.transaction_id) setTrxId(invoiceNo);
      const apiItems = Array.isArray(d?.items) ? (d.items as Record<string, unknown>[]).map((it) => ({
        product_id: String(it.product_id ?? ""),
        nama: String(it.nama ?? ""),
        qty: Number(it.qty ?? 1),
        harga_satuan: Number(it.harga_satuan ?? 0),
        subtotal: Number(it.subtotal ?? 0),
      })) : cart.map((c) => ({
        product_id: c.product.id,
        nama: c.product.name,
        qty: c.qty,
        harga_satuan: Number(c.product.sell_price),
        subtotal: Number(c.product.sell_price) * c.qty,
      }));
      const receipt = {
        invoice_no: invoiceNo,
        status: String(d?.status ?? "SUCCESS"),
        subtotal: Number(d?.subtotal ?? subtotal),
        discount_amount: Number(d?.diskon ?? discountAmt),
        tax_amount: Number(d?.ppn_11_persen ?? ppn),
        grand_total: Number(d?.grand_total ?? grandTotal),
        cash_paid: Number(d?.jumlah_bayar ?? cashPaid),
        change_amount: Number(d?.kembalian ?? Math.max(0, change)),
        created_at: String(d?.created_at ?? new Date().toISOString()),
        struk_url: String(d?.struk_url ?? ""),
        vip_member: d?.vip_member ? String(d.vip_member) : null,
        kasir_id: String(d?.kasir_id ?? ""),
        items: apiItems,
      };
      setReceiptData(receipt);
      setShowReceipt(true);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; error?: string }; status?: number } };
      const msg = axiosErr?.response?.data?.message ?? axiosErr?.response?.data?.error;
      console.error("[checkout] error:", axiosErr?.response?.status, axiosErr?.response?.data);
      toast.error(msg ?? "Transaksi gagal diproses");
    } finally {
      setProcessing(false);
    }
  };

  const resetTransaction = () => {
    setCart([]); setVipPhone(""); setVipMember(null);
    setDiscountValue(0); setCashPaid(0);
    setShowReceipt(false); setShowDetail(false); setReceiptData(null);
    toast.success("Transaksi baru dimulai");
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
                  {filtered.map((p) => (
                    <tr key={p.id} onClick={() => addToCart(p)} className="cursor-pointer">
                      <td className="text-blue-600 font-medium">{p.name}</td>
                      <td className="font-mono text-xs text-gray-500">{p.sku_code}</td>
                      <td className="text-gray-500 text-xs">{p.rack_location}</td>
                      <td className={`font-semibold ${p.current_stock < p.min_stock ? "text-amber-600" : "text-gray-800"}`}>{p.current_stock.toLocaleString("id-ID")}</td>
                      <td>{statusBadge(p.current_stock === 0 ? "OUT_OF_STOCK" : p.current_stock <= p.min_stock ? "LOW_STOCK" : "IN_STOCK")}</td>
                    </tr>
                  ))}
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
                <button onClick={() => setCart([])} className="text-xs text-red-500 hover:underline">Hapus Semua</button>
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
                <div className="grid grid-cols-2 gap-1.5">
                  {["CASH", "TRANSFER", "QRIS", "CREDIT"].map((m) => (
                    <button key={m} onClick={() => setPaymentMethod(m as "CASH" | "TRANSFER" | "QRIS" | "CREDIT")}
                      className={`py-1.5 text-xs font-medium rounded-lg border transition-colors ${paymentMethod === m ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                      {m === "CASH" ? "Tunai" : m === "TRANSFER" ? "Transfer" : m === "QRIS" ? "QRIS" : "Kredit"}
                    </button>
                  ))}
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
            <p className="text-sm text-gray-500 mb-1">Invoice #{receiptData?.invoice_no ?? trxId}</p>
            <p className="text-xs text-gray-400 mb-6">
              {new Date(receiptData?.created_at ?? new Date()).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })} WIB
            </p>

            <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left space-y-1.5">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-medium text-gray-800">{formatRupiah(receiptData?.subtotal ?? subtotal)}</span></div>
              {(receiptData?.discount_amount ?? 0) > 0 && (
                <div className="flex justify-between text-sm"><span className="text-gray-500">Diskon</span><span className="text-red-500">- {formatRupiah(receiptData?.discount_amount ?? 0)}</span></div>
              )}
              <div className="flex justify-between text-sm"><span className="text-gray-500">PPN 11%</span><span className="font-medium text-gray-800">{formatRupiah(receiptData?.tax_amount ?? ppn)}</span></div>
              <div className="flex justify-between text-sm border-t border-blue-100 pt-1.5 mt-1"><span className="text-gray-500 font-semibold">Grand Total</span><span className="font-bold text-blue-700 text-lg">{formatRupiah(receiptData?.grand_total ?? grandTotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Metode</span><span className="font-medium text-gray-800">{paymentMethod === "CASH" ? "Tunai" : paymentMethod === "TRANSFER" ? "Transfer" : paymentMethod}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Dibayar</span><span className="font-medium text-gray-800">{formatRupiah(receiptData?.cash_paid ?? cashPaid)}</span></div>
              {paymentMethod === "CASH" && (
                <div className="flex justify-between text-sm"><span className="text-gray-500">Kembalian</span><span className="font-semibold text-green-600">{formatRupiah(receiptData?.change_amount ?? Math.max(0, change))}</span></div>
              )}
              <div className="pt-2 border-t border-blue-100 mt-1">
                <p className="text-xs text-gray-400 mb-1">Invoice No</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-gray-600 bg-white rounded px-2 py-1 flex-1 truncate">{receiptData?.invoice_no ?? trxId}</code>
                  <button onClick={() => navigator.clipboard.writeText(receiptData?.invoice_no ?? trxId)} className="text-xs text-blue-600 hover:underline flex-shrink-0">Copy</button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button onClick={() => setShowDetail(true)} className="btn-primary w-full justify-center py-2.5">
                <CheckCircle size={15} /> Lihat Detail Transaksi
              </button>
              {receiptData?.struk_url && (
                <a href={receiptData.struk_url} target="_blank" rel="noreferrer" className="btn-secondary w-full justify-center py-2.5 flex items-center gap-1.5">
                  <Download size={15} /> Download Struk PDF
                </a>
              )}
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
                  <h3 className="text-base font-bold text-gray-900">Detail Transaksi — {receiptData?.invoice_no ?? trxId}</h3>
                  <p className="text-xs text-gray-500">{new Date(receiptData?.created_at ?? new Date()).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="badge-success text-sm px-3 py-1">Lunas</span>
                <button onClick={() => setShowReceipt(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
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
                <p className="font-bold text-gray-900">
                  {paymentMethod === "CASH" ? "💵 Tunai" : paymentMethod === "TRANSFER" ? "🏦 Transfer Bank" : paymentMethod === "QRIS" ? "📱 QRIS" : "📋 Kredit"}
                </p>
                {paymentMethod === "TRANSFER" && <p className="text-sm text-gray-500 mt-0.5">Ref: {Math.floor(90000000 + Math.random() * 9999999)}</p>}
              </div>
            </div>

            {/* Items Table */}
            <div className="px-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 rounded-lg">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 rounded-l-lg">No</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Produk</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500">Qty</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Harga Satuan</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 rounded-r-lg">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(receiptData?.items ?? cart.map((c) => ({ product_id: c.product.id, nama: c.product.name, qty: c.qty, harga_satuan: Number(c.product.sell_price), subtotal: Number(c.product.sell_price) * c.qty }))).map((item, i) => (
                    <tr key={item.product_id + i} className="border-b border-gray-50">
                      <td className="py-2.5 px-3 text-gray-500">{i + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-gray-800">{item.nama}</td>
                      <td className="py-2.5 px-3 text-center text-gray-700">{item.qty}</td>
                      <td className="py-2.5 px-3 text-right text-gray-700">{formatRupiah(item.harga_satuan)}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-gray-900">{formatRupiah(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="px-6 py-4 border-t border-gray-100">
              <div className="flex flex-col items-end gap-1.5 text-sm text-gray-600">
                <div className="flex justify-between w-72"><span>Subtotal</span><span>{formatRupiah(receiptData?.subtotal ?? subtotal)}</span></div>
                <div className="flex justify-between w-72"><span>Diskon</span><span className="text-red-500">- {formatRupiah(receiptData?.discount_amount ?? discountAmt)}</span></div>
                <div className="flex justify-between w-72"><span>PPN 11%</span><span>{formatRupiah(receiptData?.tax_amount ?? ppn)}</span></div>
                <div className="flex justify-between w-72 pt-2 border-t border-gray-200 mt-1">
                  <span className="font-bold text-gray-800">Grand Total</span>
                  <span className="text-2xl font-bold text-blue-700">{formatRupiah(receiptData?.grand_total ?? grandTotal)}</span>
                </div>
                <div className="flex justify-between w-72 text-gray-500"><span>Dibayar</span><span className="font-medium text-gray-800">{formatRupiah(receiptData?.cash_paid ?? cashPaid)}</span></div>
                <div className="flex justify-between w-72 text-gray-500">
                  <span>Kembalian</span>
                  <span className="font-semibold text-green-600">{formatRupiah(receiptData?.change_amount ?? Math.max(0, change))}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowDetail(false)} className="btn-secondary">
                <X size={14} /> Tutup
              </button>
              {receiptData?.struk_url && (
                <a href={receiptData.struk_url} target="_blank" rel="noreferrer" className="btn-secondary flex items-center gap-1.5">
                  <Download size={14} /> Download Struk PDF
                </a>
              )}
              <button onClick={resetTransaction} className="btn-primary">
                <ShoppingCart size={14} /> Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
