"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Archive,
  ShieldCheck,
  UserCog,
  Star,
  ClipboardList,
  BarChart3,
  ShieldAlert,
} from "lucide-react";

import { getUser } from "@/lib/auth";
import logoImg from "@/assets/logo.png";

const navItems = [
  { href: "/dashboard",           label: "Dasbor",             icon: LayoutDashboard },
  { href: "/pos",                  label: "Penjualan",           icon: ShoppingCart },
  { href: "/inventory",            label: "Inventaris",          icon: Archive },
  { href: "/warranty",             label: "Garansi",             icon: ShieldCheck },
  { href: "/user-management",      label: "Pengaturan Akses",    icon: UserCog },
  { href: "/members",              label: "Member VIP",          icon: Star },
  { href: "/transaction-history",  label: "Riwayat Transaksi",   icon: ClipboardList },
  { href: "/financial-reports",    label: "Laporan Keuangan",    icon: BarChart3 },
  { href: "/audit-log",            label: "Audit Log",           icon: ShieldAlert },
];

export default function OwnerSidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const user = mounted ? getUser() : null;
  const isCashier = user?.role === "CASHIER";

  const filteredNavItems = navItems.filter((item) => {
    if (isCashier) {
      const forbidden = ["/dashboard", "/user-management", "/financial-reports", "/audit-log"];
      return !forbidden.includes(item.href);
    }
    return true;
  });

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-200 flex flex-col animate-slide-left">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <Image src={logoImg} alt="Logo Toko Rukun Jaya" className="w-9 h-9 object-contain flex-shrink-0" priority />
        <div>
          <p className="text-sm font-bold text-gray-900 leading-tight">Toko Rukun Jaya</p>
          <p className="text-[10px] text-gray-400">Enterprise POS</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {filteredNavItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={isActive(href) ? "sidebar-item-active" : "sidebar-item"}
          >
            <Icon size={17} className="flex-shrink-0" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 text-center">v1.5.0 · Rukun Jaya POS</p>
      </div>
    </aside>
  );
}
