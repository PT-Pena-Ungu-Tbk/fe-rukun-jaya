/**
 * API Layer — Toko Rukun Jaya
 * Base URL: https://be-rukun-jaya-production.up.railway.app/api/v1
 * Auth: Bearer JWT (attached by axios interceptor)
 *
 * Endpoint aktual (dari dokumentasi JSON resmi):
 * POST   /auth/login
 * GET    /products?search=&low_stock=
 * POST   /products
 * PUT    /products/bulk-update
 * GET    /members/verify?phone=
 * POST   /transactions/checkout
 * POST   /transactions/return
 * GET    /reports/financial?start_date=&end_date=
 * GET    /audit-logs
 * GET    /employees
 * POST   /employees
 * PUT    /employees/:id
 * DELETE /employees/:id
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
  FinancialReport,
  AuditLog,
} from "@/types";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

type ApiOk<T> = { status: "success"; data: T };
type ApiMsg  = { status: "success"; message: string };

// ─── AUTH ────────────────────────────────────────────────────────────────────

export const authApi = {
  /** POST /auth/login — body: { email, password } */
  login: (data: LoginRequest) =>
    apiClient.post<ApiOk<LoginResponse>>("/auth/login", data).then((r) => r.data),
};

// ─── INVENTORY / PRODUCTS ────────────────────────────────────────────────────

export const inventoryApi = {
  /** GET /products?search=&low_stock= */
  getProducts: (params?: { search?: string; low_stock?: boolean }) =>
    apiClient.get<ApiOk<Product[]>>("/products", { params }).then((r) => r.data),

  /** POST /products */
  createProduct: (data: CreateProductRequest) =>
    apiClient.post<ApiOk<Product>>("/products", data).then((r) => r.data),

  /** PUT /products/bulk-update */
  bulkUpdateStock: (updates: { id: string; new_stock: number }[]) =>
    apiClient.put<ApiMsg>("/products/bulk-update", { updates }).then((r) => r.data),
};

// ─── MEMBERS ─────────────────────────────────────────────────────────────────

export const membersApi = {
  /** GET /members/verify?phone=08xxx */
  verifyMember: (phone: string) =>
    apiClient.get<ApiOk<Member>>("/members/verify", { params: { phone } }).then((r) => r.data),
};

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

export const transactionsApi = {
  /** POST /transactions/checkout */
  checkout: (data: CheckoutRequest) =>
    apiClient.post<ApiOk<Transaction>>("/transactions/checkout", data).then((r) => r.data),

  /** POST /transactions/return */
  returnProduct: (data: ReturnRequest) =>
    apiClient.post<ApiMsg>("/transactions/return", data).then((r) => r.data),
};

// ─── REPORTS ─────────────────────────────────────────────────────────────────

export const reportsApi = {
  /** GET /reports/financial?start_date=&end_date= */
  getFinancial: (params: { start_date: string; end_date: string }) =>
    apiClient.get<ApiOk<FinancialReport>>("/reports/financial", { params }).then((r) => r.data),
};

// ─── AUDIT LOGS ───────────────────────────────────────────────────────────────

export const auditApi = {
  /** GET /audit-logs */
  getLogs: () =>
    apiClient.get<ApiOk<AuditLog[]>>("/audit-logs").then((r) => r.data),
};

// ─── EMPLOYEES ───────────────────────────────────────────────────────────────

export interface EmployeePayload {
  name: string;
  email: string;
  password?: string;
  role: "CASHIER" | "OWNER";
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: "CASHIER" | "OWNER";
  is_active?: boolean;
}

export const employeesApi = {
  /** GET /employees */
  getList: () =>
    apiClient.get<ApiOk<Employee[]>>("/employees").then((r) => r.data),

  /** POST /employees */
  create: (data: EmployeePayload) =>
    apiClient.post<ApiOk<Employee>>("/employees", data).then((r) => r.data),

  /** PUT /employees/:id */
  update: (id: string, data: Partial<EmployeePayload>) =>
    apiClient.put<ApiOk<Employee>>(`/employees/${id}`, data).then((r) => r.data),

  /** DELETE /employees/:id */
  delete: (id: string) =>
    apiClient.delete<ApiMsg>(`/employees/${id}`).then((r) => r.data),
};

// ─── BACKWARD COMPAT (halaman lama / dashboard pakai mock) ───────────────────
export const posApi = {
  searchProducts: (params?: { q?: string }) =>
    inventoryApi.getProducts({ search: params?.q }),
  validateVip: (phone: string) =>
    membersApi.verifyMember(phone),
};

export const staffApi = {
  getList: () => employeesApi.getList(),
  create:  (d: EmployeePayload) => employeesApi.create(d),
  update:  (id: string, d: Partial<EmployeePayload>) => employeesApi.update(id, d),
  delete:  (id: string) => employeesApi.delete(id),
  toggleAccess: async (id: string) => {
    // tidak ada endpoint toggle di real API — optimistic update saja
    return { staff_id: id, is_active: true, message: "ok" };
  },
};

export const warrantyApi = {
  lookup: async (_invoiceId: string) => {
    // endpoint lookup tidak ada di real API, return null
    throw new Error("INVOICE_NOT_FOUND");
  },
  claim: (data: ReturnRequest) => transactionsApi.returnProduct(data),
};

export const dashboardApi = {
  getOverview: async () => {
    // tidak ada endpoint dashboard — throw agar halaman pakai mock fallback
    throw new Error("NO_ENDPOINT");
  },
};

export const financeApi = reportsApi;
