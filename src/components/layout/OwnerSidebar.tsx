"use client";

import Link from "next/link";
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

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-200 flex flex-col animate-slide-left">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm flex-shrink-0">
          <span className="text-white font-bold text-sm">RJ</span>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 leading-tight">Toko Rukun Jaya</p>
          <p className="text-[10px] text-gray-400">Enterprise POS</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => (
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
        <p className="text-[10px] text-gray-400 text-center">v1.0.0 · Rukun Jaya POS</p>
      </div>
    </aside>
  );
}
