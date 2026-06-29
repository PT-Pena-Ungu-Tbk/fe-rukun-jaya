import { cn } from "@/lib/utils";
import type { Product } from "@/types";
import { getStockStatus } from "@/types";

type DisplayStatus = "In Stock" | "Low Stock" | "Out of Stock";

interface StockBadgeProps {
  product?: Product;
  status?: DisplayStatus;
  className?: string;
}

export default function StockBadge({ product, status, className }: StockBadgeProps) {
  const s: DisplayStatus = status ?? (product ? getStockStatus(product) : "In Stock");

  const styles: Record<DisplayStatus, string> = {
    "In Stock": "bg-green-100 text-green-700",
    "Low Stock": "bg-amber-100 text-amber-700",
    "Out of Stock": "bg-red-100 text-red-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        styles[s],
        className
      )}
    >
      {s}
    </span>
  );
}
