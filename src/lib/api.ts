/**
 * API Layer — Toko Rukun Jaya
 * Auth: Bearer JWT (attached by axios interceptor)
 *
 * Endpoint aktual (dari dokumentasi JSON resmi):
 * POST   /auth/login
 * GET    /inventory?search=&low_stock=
 * POST   /inventory
 * PUT    /inventory/bulk-update
 * GET    /members/verify?phone=
 * GET    /members/vip
 * POST   /members/vip
 * POST   /pos/transactions
 * GET    /finance/summary?period=
 * GET    /dashboard/overview
 * GET    /audit/logs
 * GET    /staff
 * POST   /staff
 * PUT    /staff/:id
 * DELETE /staff/:id
 */

import apiClient from "./axios";
import type {
  LoginRequest,
  LoginResponse,
  Product,
  CreateProductRequest,
  Member,
  CheckoutRequest,
  Transaction,
  ReturnRequest,
  TransactionHistory,
  FinancialReport,
  FinanceSummary,
  AuditLog,
  DashboardData,
  VipMembersListResponse,
  CreateVipMemberRequest,
  VipMember,
  Employee,
  EmployeePayload,
  Supplier,
  SupplierPayload,
} from "@/types";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

type ApiOk<T> = { success?: boolean; status?: "success"; status_code?: number; message?: string; data: T };
type ApiMsg = { success?: boolean; status?: "success"; message: string };

// ─── AUTH ────────────────────────────────────────────────────────────────────

export const authApi = {
  /** POST /auth/login — body: { email_or_username, password, remember_me } */
  login: (data: LoginRequest) =>
    apiClient.post<ApiOk<LoginResponse>>("/auth/login", data).then((r) => r.data),
  refresh: (refresh_token: string) =>
    apiClient.post<ApiOk<{ access_token: string; expires_in: number }>>("/auth/refresh", { refresh_token }).then((r) => r.data),
  logout: () =>
    apiClient.post<ApiMsg>("/auth/logout").then((r) => r.data),
};

// ─── INVENTORY / PRODUCTS ────────────────────────────────────────────────────

export const inventoryApi = {
  /** GET /inventory?search=&low_stock= */
  getProducts: (params?: { search?: string; low_stock?: boolean }) =>
    apiClient.get<ApiOk<Product[]>>("/inventory", {
      params: { ...params, low_stock: params?.low_stock ? "true" : undefined },
    }).then((r) => r.data),

  /** GET /inventory/:id */
  getProduct: (id: string) =>
    apiClient.get<ApiOk<Product>>(`/inventory/${id}`).then((r) => r.data),

  /** POST /inventory */
  createProduct: (data: CreateProductRequest) =>
    apiClient.post<ApiOk<Product>>("/inventory", data).then((r) => r.data),

  /** PUT /inventory/:id */
  updateProduct: (id: string, data: Partial<CreateProductRequest>) =>
    apiClient.put<ApiOk<Product>>(`/inventory/${id}`, data).then((r) => r.data),

  /** DELETE /inventory/:id */
  deleteProduct: (id: string) =>
    apiClient.delete<ApiMsg>(`/inventory/${id}`).then((r) => r.data),

  /** PUT /inventory/bulk-update */
  bulkUpdateStock: (updates: { id: string; new_stock: number }[]) =>
    apiClient.put<ApiMsg>("/inventory/bulk-update", { updates }).then((r) => r.data),

  /** GET /inventory/bulk-update/template */
  downloadBulkUpdateTemplate: () =>
    apiClient.get<Blob>("/inventory/bulk-update/template", { responseType: 'blob' }).then((r) => r.data),

  /** GET /categories */
  getCategories: () =>
    apiClient.get<ApiOk<{ id: string; name: string }[]>>("/categories").then((r) => r.data),

  /** GET /suppliers */
  getSuppliers: () =>
    apiClient.get<ApiOk<{ id: string; name: string; contact_info?: string }[]>>("/suppliers").then((r) => r.data),
};

// ─── MEMBERS ─────────────────────────────────────────────────────────────────

export const membersApi = {
  /** GET /members/verify?phone=08xxx */
  verifyMember: (phone: string) =>
    apiClient.get<ApiOk<Member>>("/members/verify", { params: { phone } }).then((r) => r.data),
  getVipMembers: (params?: { level?: string; q?: string; page?: number; limit?: number }) =>
    apiClient.get<ApiOk<VipMembersListResponse>>("/members/vip", { params }).then((r) => r.data.data),
  createVipMember: (data: CreateVipMemberRequest) =>
    apiClient.post<ApiOk<VipMember>>("/members/vip", data).then((r) => r.data.data),
  updateMember: (id: string, data: { nama?: string; phone_number?: string; level?: string; poin?: number }) =>
    apiClient.put<ApiOk<VipMember>>(`/members/vip/${id}`, data).then((r) => r.data),
  deleteMember: (id: string) =>
    apiClient.delete<ApiMsg>(`/members/vip/${id}`).then((r) => r.data),
  redeemPoints: (memberId: string, data: { poin_ditukar: number; jenis_penukaran: string; transaction_id?: string }) =>
    apiClient.post<ApiMsg & { sisa_poin?: number }>(`/members/vip/${memberId}/redeem`, data).then((r) => r.data),
};

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

export const transactionsApi = {
  /** GET /pos/products */
  searchProducts: (params?: { search?: string; limit?: number }) =>
    apiClient.get<ApiOk<Product[]>>("/pos/products", { params }).then((r) => r.data),

  /** POST /pos/transactions */
  checkout: (data: CheckoutRequest) => {
    const payload = {
      items: data.items.map((item) => ({ product_id: item.product_id, qty: item.quantity })),
      payment_method: data.payment_method ?? "CASH",
      jumlah_bayar: data.cash_paid,
      vip_phone: data.member_id || undefined,
      diskon_persen: data.discount_type === "PERCENTAGE" ? data.discount_value : undefined,
      diskon_nominal: data.discount_type === "NOMINAL" ? data.discount_value : undefined,
      payment_reference: data.payment_reference,
      nama_pelanggan: data.customer_name,
    };
    return apiClient.post<ApiOk<Transaction>>("/pos/transactions", payload).then((r) => r.data);
  },

  /** GET /transactions */
  getTransactions: (params?: {
    payment_method?: string;
    status?: string;
    cashier_id?: string;
    date_from?: string;
    date_to?: string;
    sortBy?: string;
  }) => {
    const mappedParams: any = { ...params };
    if (params?.date_from) mappedParams.startDate = params.date_from;
    if (params?.date_to) mappedParams.endDate = params.date_to;
    return apiClient.get<ApiOk<TransactionHistory[]>>("/transactions", { params: mappedParams }).then((r) => r.data);
  },

  /** GET /pos/transactions/:transaction_id */
  getTransaction: (transactionId: string) =>
    apiClient.get<ApiOk<unknown>>(`/pos/transactions/${transactionId}`).then((r) => r.data),

  lookupWarranty: (invoiceNo: string) =>
    apiClient.get<ApiOk<any>>("/warranty/lookup", { params: { invoice_no: invoiceNo } }).then((r) => r.data.data),

  returnProduct: (data: ReturnRequest) =>
    apiClient.post<ApiMsg>("/warranty/claims", data).then((r) => r.data),

  /** GET /transactions-all */
  getAllTransactions: (params?: { startDate?: string; endDate?: string }) =>
    apiClient.get<ApiOk<TransactionHistory[]>>("/transactions/all", { params }).then((r) => r.data),
};

// ─── REPORTS ─────────────────────────────────────────────────────────────────

export const reportsApi = {
  /** GET /finance/summary */
  getFinancial: (params: { start_date?: string; end_date?: string; period?: "this_month" | "last_month" | "custom" }) =>
    apiClient.get<ApiOk<FinancialReport | FinanceSummary>>("/finance/summary", {
      params: params.period === "custom"
        ? { period: "custom", date_from: params.start_date, date_to: params.end_date }
        : { period: params.period ?? "this_month" },
    }).then((r) => r.data),

  /** GET /finance/export/pdf */
  exportPdf: (params: { date_from?: string; date_to?: string }) =>
    apiClient.get("/finance/export/pdf", {
      params,
      responseType: "blob",
    }).then((r) => r.data),
};

// ─── AUDIT LOGS ───────────────────────────────────────────────────────────────

export const auditApi = {
  /** GET /audit/logs */
  getLogs: (params?: { startDate?: string; endDate?: string }) =>
    apiClient.get<ApiOk<AuditLog[]>>("/audit/logs", { params }).then((r) => r.data),
  /** GET /audit/logs/:id */
  getLogDetail: (id: string) =>
    apiClient.get<ApiOk<any>>(`/audit/logs/${id}`).then((r) => r.data),
};

// ─── EMPLOYEES ───────────────────────────────────────────────────────────────

export const employeesApi = {
  /** GET /staff */
  getList: () =>
    apiClient.get<ApiOk<Employee[]>>("/staff").then((r) => r.data),

  /** POST /staff */
  create: (data: EmployeePayload) =>
    apiClient.post<ApiOk<Employee>>("/staff", data).then((r) => r.data),

  /** PUT /staff/:id */
  update: (id: string, data: Partial<EmployeePayload>) =>
    apiClient.put<ApiOk<Employee>>(`/staff/${id}`, data).then((r) => r.data),

  /** DELETE /staff/:id */
  delete: (id: string) =>
    apiClient.delete<ApiMsg>(`/staff/${id}`).then((r) => r.data),

  toggleAccess: (id: string) =>
    apiClient.patch<{ staff_id: string; is_active: boolean; message: string }>(`/staff/${id}/toggle-access`).then((r) => r.data),
};

// ─── SUPPLIER ───────────────────
export const suppliersApi = {
  /** GET /suppliers */
  getList: () =>
    apiClient.get<ApiOk<Supplier[]>>("/suppliers").then((r) => r.data),

  /** POST /suppliers */
  create: (data: SupplierPayload) =>
    apiClient.post<ApiOk<Supplier>>("/suppliers", data).then((r) => r.data),

  /** PUT /suppliers/:id */
  update: (id: string, data: Partial<SupplierPayload>) =>
    apiClient.put<ApiOk<Supplier>>(`/suppliers/${id}`, data).then((r) => r.data),

  /** DELETE /suppliers/:id */
  delete: (id: string) =>
    apiClient.delete<ApiMsg>(`/suppliers/${id}`).then((r) => r.data),
};

// ─── BACKWARD COMPAT (halaman lama / dashboard pakai mock) ───────────────────
export const posApi = {
  searchProducts: (params?: { q?: string }) =>
    transactionsApi.searchProducts({ search: params?.q }),
  validateVip: (phone: string) =>
    apiClient.post<ApiOk<Member>>("/pos/validate-vip", { phone }).then((r) => r.data),
};

export const staffApi = {
  getList: () => employeesApi.getList(),
  create: (d: EmployeePayload) => employeesApi.create(d),
  update: (id: string, d: Partial<EmployeePayload>) => employeesApi.update(id, d),
  delete: (id: string) => employeesApi.delete(id),
  toggleAccess: (id: string) => employeesApi.toggleAccess(id),
};

export const warrantyApi = {
  lookup: (invoiceId: string) =>
    apiClient.get<ApiOk<unknown>>("/warranty/lookup", { params: { invoice_id: invoiceId } }).then((r) => r.data),
  claim: (data: { invoice_id: string; item_kode: string; alasan_retur: string; qty_diretur: number; deskripsi_kondisi?: string }) =>
    apiClient.post<ApiOk<unknown>>("/warranty/claims", data).then((r) => r.data),
};

export const dashboardApi = {
  getOverview: () =>
    apiClient.get<ApiOk<DashboardData>>("/dashboard/overview").then((r) => r.data.data),
};

export const financeApi = reportsApi;
