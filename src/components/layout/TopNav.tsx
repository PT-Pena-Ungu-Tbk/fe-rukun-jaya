"use client";

import { Bell, Search, HelpCircle } from "lucide-react";
import { getUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface TopNavProps {
  title?: string;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  showSearch?: boolean;
  className?: string;
}

export default function TopNav({
  title,
  searchPlaceholder = "Search SKU, Product...",
  onSearch,
  showSearch = true,
  className,
}: TopNavProps) {
  const user = getUser();
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "OW";

  return (
    <header
      className={cn(
        "flex items-center justify-between px-6 py-3.5 bg-white border-b border-slate-200",
        className
      )}
    >
      {/* Left */}
      <div className="flex items-center gap-4">
        {title && <h1 className="text-base font-semibold text-slate-800">{title}</h1>}
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              onChange={(e) => onSearch?.(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-slate-100 rounded-lg border border-transparent focus:outline-none focus:border-blue-400 focus:bg-white w-72 transition-all"
            />
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
          <HelpCircle className="w-4.5 h-4.5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">{initials}</span>
          </div>
          <span className="text-sm font-medium text-slate-700">
            {user?.role === "OWNER" ? "Owner" : "Cashier 01"}
          </span>
        </div>
      </div>
    </header>
  );
}
