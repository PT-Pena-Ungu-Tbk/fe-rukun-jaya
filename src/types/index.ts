// ===== AUTH =====
export type UserRole = "OWNER" | "CASHIER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// ===== PRODUCT =====
export interface Product {
  id: string;
  sku_code: string;
  name: string;
  category: string;
  supplier: string;
  buy_price: string;
  sell_price: string;
  current_stock: number;
  defective_stock: number;
  min_stock: number;
  rack_location: string;
}

export type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

export function getStockStatus(product: Product): StockStatus {
  if (product.current_stock === 0) return "Out of Stock";
  if (product.current_stock <= product.min_stock) return "Low Stock";
  return "In Stock";
}

export interface CreateProductRequest {
  sku_code: string;
  name: string;
  category_id: string;
  supplier_id: string;
  buy_price: number;
  sell_price: number;
  current_stock: number;
  min_stock: number;
  rack_location: string;
}

export interface BulkUpdateItem {
  id: string;
  new_stock: number;
}

// ===== MEMBER =====
export interface Member {
  id: string;
  name: string;
  phone_number: string;
  status: "ACTIVE" | "INACTIVE";
}

// ===== TRANSACTION =====
export type DiscountType = "PERCENTAGE" | "NOMINAL";

export interface CartItem {
  product_id: string;
  quantity: number;
}

export interface CartItemDisplay {
  product: Product;
  quantity: number;
}

export interface CheckoutRequest {
  member_id: string | null;
  discount_type: DiscountType;
  discount_value: number;
  cash_paid: number;
  items: CartItem[];
}

export interface Transaction {
  id: string;
  invoice_no: string;
  subtotal: string;
  discount_amount: string;
  tax_amount: string;
  grand_total: string;
  cash_paid: string;
  change_amount: string;
  created_at: string;
}

export interface ReturnRequest {
  transaction_id: string;
  product_id: string;
  quantity_returned: number;
}

export interface TransactionHistory {
  id: string;
  invoice_no: string;
  date: string;
  customer: string;
  customer_type: "VIP" | "Regular";
  method: "Cash" | "Transfer" | "Credit";
  total_amount: string;
  status: "Success" | "Pending" | "Cancelled";
  cashier: string;
}

// ===== REPORTS =====
export interface FinancialReport {
  total_revenue: string;
  total_transactions: number;
  net_profit: string;
  margin_percentage: string;
  best_selling_product: string;
}

// ===== AUDIT LOG =====
export interface AuditLog {
  id: string;
  user: string;
  action: string;
  table_name: string;
  record_id: string;
  changes_payload: {
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
  };
  created_at: string;
}

// ===== SUPPLIER =====
export interface Supplier {
  id: string;
  supplier_id: string;
  vendor_name: string;
  category: string;
  primary_contact: string;
  phone: string;
  status: "Active" | "On Hold" | "Inactive";
  rating: number;
}

// ===== WAREHOUSE =====
export interface StorageZone {
  name: string;
  description: string;
  capacity_percentage: number;
  status: "Normal" | "High Utilization" | "Critical";
  rack_range: string;
  zone_type: string;
}

// ===== USER MANAGEMENT =====
export interface StaffMember {
  id: string;
  employee_id: string;
  full_name: string;
  role: UserRole;
  last_active: string;
  is_active: boolean;
}

// ===== API RESPONSE WRAPPER =====
export interface ApiSuccess<T> {
  status: "success";
  data: T;
}

export interface ApiMessage {
  status: "success";
  message: string;
}

export interface ApiError {
  status: "error";
  message: string;
}
