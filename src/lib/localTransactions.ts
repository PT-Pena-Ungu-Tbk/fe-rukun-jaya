const KEY = "rj_transactions";

export interface LocalTransaction {
  invoice_no: string;
  grand_total: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  cash_paid: number;
  change_amount: number;
  payment_method: string;
  created_at: string;
  items: { name: string; sku_code: string; qty: number; price: number }[];
  customer: string | null;
}

export function saveTransaction(tx: LocalTransaction) {
  try {
    const existing = getTransactions();
    const updated = [tx, ...existing].slice(0, 100); // max 100
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {}
}

export function getTransactions(): LocalTransaction[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}
