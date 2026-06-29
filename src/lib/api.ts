/**
 * API Layer — Toko Rukun Jaya
 * Base URL proxied via /api/v1/[...path]/route.ts → Railway backend
 *
 * Endpoint aktual (dokumentasi v4):
 * POST   /auth/login | /auth/refresh | /auth/logout
 * GET    /inventory  | POST /inventory | GET|PUT|DELETE /inventory/{id}
 * PUT    /inventory/bulk-update
 * GET    /staff  | POST | GET|PUT|DELETE /staff/{id}
 * PATCH  /staff/{id}/toggle-access
 * GET    /members/vip | POST /members/vip
 * POST   /pos/validate-vip?phone=
 * POST   /pos/transactions
 * GET    /pos/transactions/{id}
 * GET    /pos/products
 * GET    /finance/summary?period=&date_from=&date_to=
 * GET    /dashboard/overview?date=
 * GET    /audit/logs | /audit/logs/{id}
 * GET    /warranty/lookup?invoice_no=
 * POST   /warranty/claims
 */

import apiClient from "./axios";

type ApiOk<T> = { success: boolean; data: T; message?: string };
type ApiMsg   = { success: boolean; message: string };

// ─── AUTH ────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (data: { email: string; password: string }) =>
    apiClient.post<ApiOk<{ token: string; user: Record<string, unknown> }>>("/auth/login", data).then((r) => r.data),

  refresh: () =>
    apiClient.post<ApiOk<{ token: string }>>("/auth/refresh").then((r) => r.data),

  logout: () =>
    apiClient.post<ApiMsg>("/auth/logout").then((r) => r.data),
};

// ─── INVENTORY ───────────────────────────────────────────────────────────────

export const inventoryApi = {
  getProducts: (params?: { search?: string; low_stock?: boolean }) =>
    apiClient.get("/inventory", { params }).then((r) => r.data),

  getProduct: (id: string) =>
    apiClient.get(`/inventory/${id}`).then((r) => r.data),

  createProduct: (data: Record<string, unknown>) =>
    apiClient.post("/inventory", data).then((r) => r.data),

  updateProduct: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`/inventory/${id}`, data).then((r) => r.data),

  deleteProduct: (id: string) =>
    apiClient.delete(`/inventory/${id}`).then((r) => r.data),

  bulkUpdateStock: (updates: { id: string; new_stock: number }[]) =>
    apiClient.put("/inventory/bulk-update", { updates }).then((r) => r.data),
};

// ─── STAFF ───────────────────────────────────────────────────────────────────

export interface StaffPayload {
  name: string;
  email: string;
  password?: string;
  role: "CASHIER" | "OWNER";
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: "CASHIER" | "OWNER";
  is_active?: boolean;
}

export const staffApi = {
  getList: () =>
    apiClient.get("/staff").then((r) => r.data),

  getDetail: (id: string) =>
    apiClient.get(`/staff/${id}`).then((r) => r.data),

  create: (data: StaffPayload) =>
    apiClient.post("/staff", data).then((r) => r.data),

  update: (id: string, data: Partial<StaffPayload>) =>
    apiClient.put(`/staff/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/staff/${id}`).then((r) => r.data),

  toggleAccess: (id: string) =>
    apiClient.patch(`/staff/${id}/toggle-access`).then((r) => r.data),
};

// ─── MEMBERS VIP ─────────────────────────────────────────────────────────────

export const membersApi = {
  getList: () =>
    apiClient.get("/members/vip").then((r) => r.data),

  register: (data: { phone_number: string; name: string }) =>
    apiClient.post("/members/vip", data).then((r) => r.data),

  redeem: (member_id: string, data: Record<string, unknown>) =>
    apiClient.post(`/members/vip/${member_id}/redeem`, data).then((r) => r.data),
};

// ─── POS ─────────────────────────────────────────────────────────────────────

export const posApi = {
  /** POST /pos/validate-vip?phone=08xxx */
  validateVip: (phone: string) =>
    apiClient.post("/pos/validate-vip", null, { params: { phone } }).then((r) => r.data),

  /** GET /pos/products?search= */
  getProducts: (params?: { search?: string }) =>
    apiClient.get("/pos/products", { params }).then((r) => r.data),

  /** POST /pos/transactions */
  checkout: (data: {
    items: { product_id: string; qty: number }[];
    payment_method: "CASH" | "QRIS" | "DEBIT" | "TRANSFER";
    jumlah_bayar: number;
    vip_phone?: string;
    diskon_persen?: number;
    diskon_nominal?: number;
    nama_pelanggan?: string;
    payment_reference?: string;
  }) =>
    apiClient.post("/pos/transactions", data).then((r) => r.data),

  /** GET /pos/transactions/{id} */
  getTransaction: (id: string) =>
    apiClient.get(`/pos/transactions/${id}`).then((r) => r.data),
};

// ─── FINANCE ─────────────────────────────────────────────────────────────────

export const financeApi = {
  /** GET /finance/summary?period=&date_from=&date_to= */
  getSummary: (params: { period?: string; date_from?: string; date_to?: string }) =>
    apiClient.get("/finance/summary", { params }).then((r) => r.data),
};

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

export const dashboardApi = {
  /** GET /dashboard/overview?date=YYYY-MM-DD */
  getOverview: (date?: string) =>
    apiClient.get("/dashboard/overview", { params: date ? { date } : {} }).then((r) => r.data),
};

// ─── AUDIT LOGS ──────────────────────────────────────────────────────────────

export const auditApi = {
  getLogs: () =>
    apiClient.get("/audit/logs").then((r) => r.data),

  getLog: (id: string) =>
    apiClient.get(`/audit/logs/${id}`).then((r) => r.data),
};

// ─── WARRANTY ────────────────────────────────────────────────────────────────

export const warrantyApi = {
  /** GET /warranty/lookup?invoice_no= */
  lookup: (invoice_no: string) =>
    apiClient.get("/warranty/lookup", { params: { invoice_no } }).then((r) => r.data),

  /** POST /warranty/claims */
  claim: (data: {
    invoice_no: string;
    product_id: string;
    qty: number;
    reason: "CACAT_PABRIK" | "SALAH_KIRIM" | "KUALITAS_TIDAK_SESUAI" | "LAINNYA";
  }) =>
    apiClient.post("/warranty/claims", data).then((r) => r.data),
};

// ─── BACKWARD COMPAT ─────────────────────────────────────────────────────────

export const employeesApi = staffApi;
export const transactionsApi = {
  checkout: posApi.checkout,
  returnProduct: warrantyApi.claim,
};
export const reportsApi = {
  getFinancial: (params: { start_date: string; end_date: string }) =>
    financeApi.getSummary({ date_from: params.start_date, date_to: params.end_date }),
};
export const inventoryApiLegacy = inventoryApi;
