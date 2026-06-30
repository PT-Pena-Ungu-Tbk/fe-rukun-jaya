"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingCart,
  Search,
  Package,
  Clock,
  Settings,
  LogOut,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clearAuth } from "@/lib/auth";
import logoImg from "@/assets/logo.png";

const navItems = [
  { href: "/pos", icon: ShoppingCart, label: "Transaksi Penjualan" },
  { href: "/product-search", icon: Search, label: "Pencarian Produk" },
  { href: "/check-stock", icon: Package, label: "Cek Stok" },
  { href: "/transaction-history", icon: Clock, label: "Riwayat Transaksi" },
];

export default function CashierSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <aside className="flex flex-col w-52 min-h-screen bg-[#1E3A5F] text-white">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src={logoImg.src} alt="Logo Toko Rukun Jaya" className="w-9 h-9 object-contain bg-white rounded-lg p-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold leading-tight">Toko Rukun Jaya</p>
            <p className="text-[10px] text-slate-400">Penjualan & Kasir</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4 space-y-0.5 border-t border-white/10 pt-3">
        <Link
          href="/pos-settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all"
        >
          <Settings className="w-4 h-4" />
          Pengaturan POS
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>
    </aside>
  );
}
