// ===== API RESPONSE WRAPPER =====
export interface ApiResponse<T> {
  success: boolean;
  status_code: number;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  };
  timestamp?: string;
  request_id?: string;
}

// Kept for backward compat with older api.ts callers
export type ApiSuccess<T> = ApiResponse<T>;
export interface ApiMessage {
  success: boolean;
  message: string;
}

// ===== AUTH =====
export type UserRole = "OWNER" | "CASHIER" | "WAREHOUSE_ADMIN" | "MANAGER";

/** Internal user shape stored in cookies */
export interface User {
  id: string;
  name: string; // mapped from api's nama_lengkap
  email: string;
  role: UserRole;
}

/** Raw user shape from API /auth/login response */
export interface ApiUser {
  id: string;
  nama_lengkap: string;
  email: string;
  role: UserRole;
  permissions: string[];
  last_login: string;
  avatar_url?: string;
}

export interface LoginRequest {
  email_or_username: string;
  password: string;
  remember_me?: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  user: ApiUser;
}

// ===== PRODUCT (real API /products) =====
export interface CreateProductRequest {
  sku_code: string;
  name: string;
  category_id?: string;
  supplier_id?: string;
  buy_price: number;
  sell_price: number;
  current_stock: number;
  min_stock: number;
  rack_location: string;
}

// ===== MEMBER (real API /members/verify) =====
export interface Member {
  id: string;
  name: string;
  phone: string;
  level?: string;
  points?: number;
}

// ===== CHECKOUT / TRANSACTIONS =====
export interface CheckoutRequest {
  member_id?: string | null;
  discount_type: "NOMINAL" | "PERCENTAGE";
  discount_value: number;
  cash_paid: number;
  payment_method?: "CASH" | "TRANSFER" | "QRIS" | "CREDIT";
  payment_reference?: string;
  customer_name?: string;
  items: { product_id: string; quantity: number }[];
}

export interface Transaction {
  id?: string;
  transaction_id?: string;
  invoice_no?: string;
  total?: number;
  grand_total?: number;
  status?: string;
  created_at?: string;
}

export interface ReturnRequest {
  transaction_id: string;
  product_id: string;
  quantity_returned: number;
}

// ===== FINANCIAL REPORT =====
export interface FinancialReport {
  period?: { start: string; end: string };
  total_revenue?: number;
  total_profit?: number;
  transaction_count?: number;
  data?: Record<string, unknown>[];
}

// ===== DASHBOARD =====
export interface StockWarning {
  sku: string;
  nama: string;
  stok: number;
  satuan: string;
  status: "CRITICAL" | "LOW" | "EMPTY";
}

export interface DashboardSummary {
  pendapatan_hari_ini: number;
  pendapatan_kemarin: number;
  persentase_perubahan_pendapatan: number;
  profit_kotor: number;
  profit_kemarin: number;
  persentase_perubahan_profit: number;
  volume_transaksi: number;
  volume_transaksi_kemarin: number;
  persentase_perubahan_volume: number;
  jumlah_pelanggan: number;
  jumlah_pelanggan_kemarin: number;
  persentase_perubahan_pelanggan: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  peringatan_stok: StockWarning[];
  produk_terlaris: { nama: string; unit_terjual: number; total_nilai: number }[];
  aktivitas_terbaru: { tipe: string; deskripsi: string; waktu: string }[];
  metode_pembayaran: {
    tunai: { persentase: number; total: number };
    transfer_bank: { persentase: number; total: number };
    qris: { persentase: number; total: number };
    total_terproses: number;
  };
  daily_sales_chart: { hari: string; nilai: number }[];
}

// ===== POS =====
export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export interface PosProduct {
  id: string;
  nama_barang: string;
  kode_sku: string;
  rak: string;
  stok: number;
  harga_jual: number;
  status: StockStatus;
  satuan: string;
}

export interface PosTransactionItem {
  product_id: string;
  qty: number;
}

export interface PosCheckoutRequest {
  items: PosTransactionItem[];
  payment_method: "CASH" | "TRANSFER" | "QRIS" | "CREDIT";
  jumlah_bayar?: number; // wajib jika CASH
  vip_phone?: string;
  diskon_persen?: number;
  diskon_nominal?: number;
  payment_reference?: string;
  nama_pelanggan?: string;
}

export interface PosCheckoutResponseItem {
  product_id: string;
  nama: string;
  qty: number;
  harga_satuan: number;
  subtotal: number;
}

export interface PosCheckoutResponse {
  transaction_id: string;
  status: string;
  subtotal: number;
  diskon: number;
  ppn_11_persen: number;
  grand_total: number;
  jumlah_bayar: number;
  kembalian: number;
  vip_member: VipValidationResponse | null;
  kasir_id: string;
  created_at: string;
  struk_url: string;
  items: PosCheckoutResponseItem[];
}

export interface PosTransactionDetail {
  transaction_id: string;
  status: "LUNAS" | "PENDING" | "CANCELLED";
  created_at: string;
  informasi_pelanggan: {
    nama?: string;
    phone?: string;
    alamat?: string;
  };
  metode_pembayaran: {
    tipe: string;
    referensi?: string;
  };
  items: {
    nama: string;
    kode_sku: string;
    qty: number;
    harga_satuan: number;
    total_harga: number;
  }[];
  subtotal: number;
  diskon_member: number;
  ppn_11_persen: number;
  grand_total: number;
  pdf_url?: string;
  struk_url?: string;
}

export interface VipValidationResponse {
  is_member: boolean;
  member_id?: string;
  nama?: string;
  level?: "Gold" | "Silver" | "Bronze";
  poin?: number;
}

// ===== INVENTORY =====
export interface InventoryItem {
  id: string;
  nama_barang: string;
  kondisi: "Baru" | "Rusak Ringan" | "Rusak Berat";
  stok: number;
  satuan: string;
  harga_beli: number;
  harga_jual: number;
  exp_date?: string | null;
  kode_rak: string;
}

export interface InventoryListResponse {
  summary: {
    stok_habis: number;
    di_bawah_minimum: number;
    akan_expired: number;
  };
  items: InventoryItem[];
}

export interface CreateInventoryRequest {
  nama_barang: string;
  kategori: string;
  kondisi: "Baru" | "Rusak Ringan" | "Rusak Berat";
  jumlah_stok_awal: number;
  satuan: string;
  kode_rak?: string;
  harga_beli: number;
  harga_jual: number;
  tanggal_kadaluarsa?: string;
  stok_minimum?: number;
}

export interface BulkUpdateItem {
  item_id: string;
  stok_fisik_baru: number;
  kode_rak?: string;
  keterangan?: string;
}

export interface BulkUpdateRequest {
  gudang_id: string;
  items: BulkUpdateItem[];
}

export interface BulkUpdateResponse {
  updated_count: number;
  failed_count: number;
  selisih_signifikan: number;
  results: {
    item_id: string;
    status: string;
    stok_lama: number;
    stok_baru: number;
    selisih: number;
  }[];
  audit_log_id: string;
}

export interface InventoryDetail {
  id: string;
  nama_barang: string;
  kode_sku: string;
  brand?: string;
  kategori: string;
  berat_net?: string;
  standar_sni?: string;
  harga_beli: number;
  harga_jual: number;
  margin_persen: number;
  stok_tersedia: number;
  stok_minimum_reorder: number;
  distribusi_stok: { rak: string; jumlah: number; level_stok: "Optimal" | "Low" | "Critical" }[];
  gambar_urls: string[];
  last_stock_update: string;
}

// ===== WARRANTY / RETUR =====
export interface WarrantyLookupItem {
  kode_item: string;
  nama_barang: string;
  qty_beli: number;
  qty_sudah_diretur: number;
  harga_satuan: number;
  can_return: boolean;
}

export interface WarrantyLookupResponse {
  nota_id: string;
  tanggal: string;
  items: WarrantyLookupItem[];
}

export interface WarrantyClaimRequest {
  invoice_id: string;
  item_kode: string;
  alasan_retur: "CACAT_PABRIK" | "SALAH_KIRIM" | "KUALITAS_TIDAK_SESUAI" | "LAINNYA";
  qty_diretur: number;
  deskripsi_kondisi?: string;
}

export interface WarrantyClaimResponse {
  claim_id: string;
  status: "APPROVED" | "PENDING_REVIEW";
  estimasi_nilai_retur: number;
  stok_berkurang: boolean;
  catatan?: string;
}

// ===== FINANCE =====
export interface FinanceSummary {
  total_omzet: number;
  keuntungan_bersih: number;
  persentase_omzet_vs_sebelumnya: number;
  persentase_profit_vs_sebelumnya: number;
  periode: { date_from: string; date_to: string };
}

export interface FinanceTransaction {
  id_transaksi: string;
  tanggal_waktu: string;
  pelanggan: string;
  metode_pembayaran: string;
  total_transaksi: number;
  status: "Sukses" | "Pending" | "Cancelled";
  kasir_id: string;
}

// ===== TRANSACTIONS OVERVIEW =====
export interface TransactionOverview {
  total_revenue_today: number;
  total_transactions: number;
  transactions_change_pct: number;
  pending_count: number;
  revenue_trends: { date: string; nilai: number }[];
  transactions: FinanceTransaction[];
  audit_trail: { tipe: string; deskripsi: string; waktu: string; aktor: string }[];
}

// ===== STAFF =====
export interface StaffMember {
  id?: string;
  id_karyawan?: string;
  employee_id?: string;
  nama_lengkap?: string;
  full_name?: string;
  jabatan?: string;
  role?: UserRole;
  login_time?: string;
  is_active: boolean;
  last_active?: string;
  last_activity?: string;
}

export interface CreateStaffRequest {
  full_name: string;
  role: "CASHIER" | "WAREHOUSE_ADMIN" | "MANAGER";
  phone_number: string;
  email: string;
  password: string;
}

export interface EditStaffRequest {
  nama_lengkap?: string;
  email?: string;
  role?: UserRole;
  is_active?: boolean;
}

// ===== VIP MEMBERS =====
export interface VipMember {
  member_id: string;
  nama: string;
  phone_number: string;
  level: "Gold" | "Silver" | "Bronze";
  poin: number;
  join_date: string;
  last_transaction?: string;
}

export interface VipMembersStats {
  total_members: number;
  active_members: number;
  total_poin_issued: number;
}

export interface VipMembersListResponse {
  stats: VipMembersStats;
  items: VipMember[];
}

export interface CreateVipMemberRequest {
  nama: string;
  phone_number: string;
  level?: "Gold" | "Silver" | "Bronze";
  poin_awal?: number;
}

// ===== AUDIT LOG =====
export interface AuditLog {
  user: {
    id: string;
    nama: string;
    jabatan: string;
    avatar_url?: string;
  };
  waktu: string;
  aktivitas: "EDIT_HARGA" | "HAPUS_BARANG" | "LOGIN" | "RETUR_PEMBELIAN";
  detail_perubahan: string;
  nilai_lama?: string;
  nilai_baru?: string;
  ip_address?: string;
}

// ===== LEGACY COMPAT (used in old pages) =====
export interface Supplier {
  id: string;
  supplier_id: string;
  vendor_name: string;
  category: string;
  primary_contact: string;
  phone: string;
  status: "Active" | "Inactive" | "On Hold" | string;
  rating: number;
}

export interface TransactionHistory {
  id: string;
  invoice_no: string;
  date: string;
  customer: string;
  customer_type: string;
  method: string;
  total_amount: string;
  status: "Success" | "Pending" | "Cancelled" | string;
  cashier: string;
}

export interface StorageZone {
  name: string;
  description: string;
  capacity_percentage: number;
  status: string;
  rack_range: string;
  zone_type: string;
}

export interface Product {
  id: string;
  sku_code: string;
  name: string;
  category?: string;
  supplier?: string;
  category_id?: string;
  supplier_id?: string;
  buy_price: string;
  sell_price: string;
  current_stock: number;
  defective_stock: number;
  min_stock: number;
  rack_location?: string | null;
}

export function getStockStatus(product: Product): "In Stock" | "Low Stock" | "Out of Stock" {
  if (product.current_stock === 0) return "Out of Stock";
  if (product.current_stock <= product.min_stock) return "Low Stock";
  return "In Stock";
}
