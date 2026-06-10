"use client";

import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef } from "react";
import { LucideIcon } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  onIconRightClick?: () => void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon: Icon, iconRight: IconRight, onIconRightClick, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Icon className="w-4 h-4 text-slate-400" />
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "disabled:bg-slate-50 disabled:text-slate-500",
              error && "border-red-500 focus:ring-red-500",
              Icon && "pl-10",
              IconRight && "pr-10",
              className
            )}
            {...props}
          />
          {IconRight && (
            <button
              type="button"
              onClick={onIconRightClick}
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <IconRight className="w-4 h-4" />
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
