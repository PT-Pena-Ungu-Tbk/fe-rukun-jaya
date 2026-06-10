import CashierSidebar from "@/components/layout/CashierSidebar";

export default function CashierLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <CashierSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
