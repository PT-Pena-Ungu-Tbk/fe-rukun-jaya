"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { inventoryApi, membersApi, transactionsApi } from "@/lib/api";
import { mockProducts } from "@/lib/mockData";
import { formatRupiah } from "@/lib/utils";
import { getStockStatus } from "@/types";
import type { CartItemDisplay, Member, DiscountType, Transaction } from "@/types";
import { Bell, User as UserIcon, Search, ShoppingCart, X, Plus, Minus, CheckCircle, Printer, Download } from "lucide-react";
import toast from "react-hot-toast";

const CATEGORIES = ["All Items", "Cement & Sand", "Pipes & Fittings", "Tools", "Paints"];
const STEPS = ["Product Search", "Add to Cart", "VIP Validation", "Payment"];

type Step = 1 | 2 | 3 | 4;

export default function POSPage() {
  const [step] = useState<Step>(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Items");
  const [cart, setCart] = useState<CartItemDisplay[]>([]);
  const [phone, setPhone] = useState("");
  const [member, setMember] = useState<Member | null>(null);
  const [discountType, setDiscountType] = useState<DiscountType>("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState(0);
  const [cashPaid, setCashPaid] = useState(1000000);
  const [receipt, setReceipt] = useState<Transaction | null>(null);

  const { data } = useQuery({
    queryKey: ["products", search],
    queryFn: () => inventoryApi.getProducts({ search }),
  });

  const products = data?.data ?? mockProducts;
  const filtered = products.filter((p) => {
    const matchCat = category === "All Items" || p.category === category;
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku_code.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToCart = (product: (typeof products)[0]) => {
    if (getStockStatus(product) === "Out of Stock") return;
    const existing = cart.find((c) => c.product.id === product.id);
    if (existing) {
      setCart(cart.map((c) =>
        c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQty = (id: string, delta: number) => {
    setCart(
      cart
        .map((c) =>
          c.product.id === id ? { ...c, quantity: c.quantity + delta } : c
        )
        .filter((c) => c.quantity > 0)
    );
  };

  const subtotal = cart.reduce(
    (sum, c) => sum + parseFloat(c.product.sell_price) * c.quantity,
    0
  );

  const discountAmount =
    discountType === "PERCENTAGE"
      ? (subtotal * discountValue) / 100
      : discountValue;

  const taxAmount = Math.round((subtotal - discountAmount) * 0.11);
  const grandTotal = subtotal - discountAmount + taxAmount;
  const change = cashPaid - grandTotal;

  const verifyMutation = useMutation({
    mutationFn: () => membersApi.verifyMember(phone),
    onSuccess: (res) => {
      setMember(res.data);
      toast.success(`VIP member ${res.data.name} ditemukan!`);
    },
    onError: () => {
      setMember(null);
      toast.error("Member tidak ditemukan.");
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: () =>
      transactionsApi.checkout({
        member_id: member?.id ?? null,
        discount_type: discountType,
        discount_value: discountValue,
        cash_paid: cashPaid,
        items: cart.map((c) => ({ product_id: c.product.id, quantity: c.quantity })),
      }),
    onSuccess: (res) => {
      setReceipt(res.data);
      setCart([]);
      setMember(null);
      setPhone("");
      setDiscountValue(0);
    },
    onError: () => toast.error("Transaksi gagal. Coba lagi."),
  });

  // Receipt Modal
  if (receipt) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-slate-100">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Transaction Successful!</h2>
            <p className="text-sm text-slate-500 mt-1">Order {receipt.invoice_no} has been processed.</p>
          </div>

          {/* Receipt */}
          <div className="border border-slate-200 rounded-lg p-4 mb-5 font-mono text-xs">
            <div className="text-center mb-3">
              <p className="font-bold">Toko Bangunan Ci Ailing</p>
              <p>Jl. Raya Industri No. 42</p>
              <p>{new Date(receipt.created_at).toLocaleString("id-ID")}</p>
            </div>
            <div className="border-t border-dashed border-slate-300 my-2" />
            <div className="space-y-1 mb-2">
              {cart.length > 0 ? cart.map((c) => (
                <div key={c.product.id} className="flex justify-between">
                  <span>{c.product.name} ({c.quantity})</span>
                  <span>Rp {(parseFloat(c.product.sell_price) * c.quantity).toLocaleString("id-ID")}</span>
                </div>
              )) : (
                <>
                  <div className="flex justify-between"><span>Semen Tiga Roda 50kg (10)</span><span>Rp 650.000</span></div>
                  <div className="flex justify-between"><span>Pipa Wavin AW 1/2&quot; (5)</span><span>Rp 160.000</span></div>
                </>
              )}
            </div>
            <div className="border-t border-dashed border-slate-300 my-2" />
            <div className="space-y-1">
              <div className="flex justify-between"><span>Subtotal:</span><span>Rp {Number(receipt.subtotal).toLocaleString("id-ID")}</span></div>
              <div className="flex justify-between"><span>PPN (11%):</span><span>Rp {Number(receipt.tax_amount).toLocaleString("id-ID")}</span></div>
              <div className="flex justify-between"><span>VIP Discount:</span><span>-Rp {Number(receipt.discount_amount).toLocaleString("id-ID")}</span></div>
            </div>
            <div className="border-t border-dashed border-slate-300 my-2" />
            <div className="flex justify-between font-bold text-sm"><span>Grand Total:</span><span>Rp {Number(receipt.grand_total).toLocaleString("id-ID")}</span></div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between"><span>Payment Method:</span><span>Cash</span></div>
              <div className="flex justify-between"><span>Paid:</span><span>Rp {Number(receipt.cash_paid).toLocaleString("id-ID")}</span></div>
              <div className="flex justify-between"><span>Change:</span><span>Rp {Number(receipt.change_amount).toLocaleString("id-ID")}</span></div>
            </div>
          </div>

          <div className="space-y-2">
            <button className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>
            <button className="w-full py-2.5 border border-slate-200 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              Export to PDF
            </button>
            <button
              onClick={() => setReceipt(null)}
              className="w-full text-sm text-blue-600 hover:underline pt-1"
            >
              ← Back to New Transaction
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-200">
        <h2 className="text-base font-bold text-slate-800">New Sales Transaction</h2>
        <div className="flex items-center gap-3">
          <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
            <Bell className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">C1</span>
            </div>
            <span className="text-slate-700 font-medium">Cashier 01</span>
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Active Shift</span>
          </div>
        </div>
      </header>

      {/* Steps */}
      <div className="flex items-center gap-0 bg-white border-b border-slate-100 px-5 py-3">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              i + 1 === 1 ? "bg-blue-600 text-white" : "text-slate-400"
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                i + 1 === 1 ? "bg-white text-blue-600" : "bg-slate-200 text-slate-500"
              }`}>{i + 1}</span>
              {s}
            </div>
            {i < 3 && <div className="w-8 h-px bg-slate-200 mx-1" />}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex flex-1 gap-0 overflow-hidden">
        {/* Left: Products */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Scan barcode or search SKU/Product Name..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Category filters */}
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap ${
                  category === c
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-slate-200 text-slate-600"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Products grid */}
          <div className="grid grid-cols-4 gap-2.5 overflow-y-auto flex-1">
            {filtered.map((p) => {
              const status = getStockStatus(p);
              const isOutOfStock = status === "Out of Stock";
              return (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className={`bg-white border rounded-xl p-3 cursor-pointer hover:shadow-md transition-all ${
                    isOutOfStock ? "opacity-60 cursor-not-allowed border-slate-200" : "border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      status === "In Stock" ? "bg-green-100 text-green-700" :
                      status === "Low Stock" ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    }`}>{status}</span>
                    <span className="text-[9px] text-slate-400">{p.rack_location}</span>
                  </div>
                  <div className="w-full h-12 bg-slate-100 rounded-lg mb-2 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-slate-300" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">{p.sku_code}</p>
                  <p className="text-xs font-semibold text-slate-800 leading-tight mt-0.5 truncate">{p.name}</p>
                  <p className="text-sm font-bold text-blue-600 mt-1">
                    Rp {Number(p.sell_price).toLocaleString("id-ID")}
                  </p>
                  <p className="text-[10px] text-slate-400">Stock {p.current_stock}</p>
                  {isOutOfStock ? (
                    <div className="mt-2 text-center text-[10px] text-red-500 font-medium">Out of Stock</div>
                  ) : (
                    <button className="mt-2 w-full flex items-center justify-center gap-1 text-[10px] font-medium text-blue-600 hover:bg-blue-50 rounded py-1 border border-blue-200">
                      <ShoppingCart className="w-3 h-3" />
                      Add to Cart
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Order Panel */}
        <div className="w-72 bg-white border-l border-slate-200 flex flex-col">
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800">Current Order</h3>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                  <X className="w-3 h-3" />
                  Clear All
                </button>
              )}
            </div>
            {cart.length > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">{cart.length} items in cart</p>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Keranjang kosong</p>
              </div>
            ) : (
              cart.map((c) => (
                <div key={c.product.id} className="flex items-start justify-between py-2 border-b border-slate-100">
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="text-xs font-medium text-slate-800 truncate">{c.product.name}</p>
                    <p className="text-[11px] text-slate-500">
                      Rp {Number(c.product.sell_price).toLocaleString("id-ID")} / unit
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => updateQty(c.product.id, -1)} className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center hover:bg-slate-200">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-semibold w-6 text-center">{c.quantity}</span>
                    <button onClick={() => updateQty(c.product.id, 1)} className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center hover:bg-slate-200">
                      <Plus className="w-3 h-3" />
                    </button>
                    <button onClick={() => updateQty(c.product.id, -c.quantity)} className="text-slate-300 hover:text-red-400 ml-1">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* VIP & Discount */}
          <div className="px-4 py-3 border-t border-slate-100 space-y-2">
            <div>
              <p className="text-xs font-medium text-slate-700 mb-1">VIP Member</p>
              <div className="flex gap-2">
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone Number"
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  onClick={() => verifyMutation.mutate()}
                  disabled={!phone || verifyMutation.isPending}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-60"
                >
                  Validate
                </button>
              </div>
              {member && (
                <p className="text-xs text-green-600 mt-1">✓ {member.name} — VIP Active</p>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-slate-700 mb-1">Discount</p>
              <div className="flex gap-2">
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                  className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="PERCENTAGE">%</option>
                  <option value="NOMINAL">Rp</option>
                </select>
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  placeholder="Amount..."
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="px-4 py-3 border-t border-slate-100 space-y-1">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Subtotal</span>
              <span>Rp {subtotal.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>Discount</span>
              <span className="text-red-500">- Rp {discountAmount.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>PPN (11%)</span>
              <span>Rp {taxAmount.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between font-bold text-base text-slate-800 pt-1 border-t border-slate-100 mt-1">
              <span>Grand Total</span>
              <span className="text-blue-600">Rp {grandTotal.toLocaleString("id-ID")}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="px-4 py-3 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-700 mb-1.5">Amount Received</p>
            <div className="flex">
              <span className="px-3 py-2 bg-slate-100 text-xs text-slate-500 rounded-l-lg border border-r-0 border-slate-200">Rp</span>
              <input
                type="number"
                value={cashPaid}
                onChange={(e) => setCashPaid(Number(e.target.value))}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-600">
              <span>Change</span>
              <span className={change >= 0 ? "text-green-600 font-semibold" : "text-red-500"}>
                Rp {Math.max(change, 0).toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* Pay Button */}
          <div className="px-4 pb-4">
            <button
              onClick={() => checkoutMutation.mutate()}
              disabled={cart.length === 0 || cashPaid < grandTotal || checkoutMutation.isPending}
              className="w-full py-3 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              {checkoutMutation.isPending ? "Memproses..." : "Pay & Print Receipt"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
