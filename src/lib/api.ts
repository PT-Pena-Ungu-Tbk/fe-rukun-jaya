/**
 * API Contract: Sistem Kasir Toko Rukun Jaya
 * Base URL: http://localhost:5000/api/v1
 * All protected routes send: Authorization: Bearer <JWT_TOKEN>
 */

import apiClient from "./axios";
import type {
  LoginRequest,
  LoginResponse,
  Product,
  CreateProductRequest,
  BulkUpdateItem,
  Member,
  CheckoutRequest,
  Transaction,
  ReturnRequest,
  FinancialReport,
  AuditLog,
  ApiSuccess,
  ApiMessage,
} from "@/types";

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const authApi = {
  /** POST /auth/login */
  login: async (data: LoginRequest): Promise<ApiSuccess<LoginResponse>> => {
    const res = await apiClient.post("/auth/login", data);
    return res.data;
  },
};

// ─── INVENTORY ────────────────────────────────────────────────────────────────
export const inventoryApi = {
  /** GET /products */
  getProducts: async (params?: {
    search?: string;
    low_stock?: boolean;
  }): Promise<ApiSuccess<Product[]>> => {
    const res = await apiClient.get("/products", { params });
    return res.data;
  },

  /** POST /products */
  createProduct: async (
    data: CreateProductRequest
  ): Promise<ApiSuccess<Partial<Product>> & { message: string }> => {
    const res = await apiClient.post("/products", data);
    return res.data;
  },

  /** PUT /products/bulk-update */
  bulkUpdateStock: async (
    updates: BulkUpdateItem[]
  ): Promise<ApiMessage> => {
    const res = await apiClient.put("/products/bulk-update", { updates });
    return res.data;
  },
};

// ─── MEMBERS ──────────────────────────────────────────────────────────────────
export const membersApi = {
  /** GET /members/verify?phone=08123456789 */
  verifyMember: async (phone: string): Promise<ApiSuccess<Member>> => {
    const res = await apiClient.get("/members/verify", {
      params: { phone },
    });
    return res.data;
  },
};

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────
export const transactionsApi = {
  /** POST /transactions/checkout */
  checkout: async (
    data: CheckoutRequest
  ): Promise<ApiSuccess<Transaction> & { message: string }> => {
    const res = await apiClient.post("/transactions/checkout", data);
    return res.data;
  },

  /** POST /transactions/return */
  returnProduct: async (data: ReturnRequest): Promise<ApiMessage> => {
    const res = await apiClient.post("/transactions/return", data);
    return res.data;
  },

  /** GET /transactions (transaction history - extended endpoint) */
  getHistory: async (params?: {
    start_date?: string;
    end_date?: string;
    status?: string;
    method?: string;
  }): Promise<ApiSuccess<Transaction[]>> => {
    const res = await apiClient.get("/transactions", { params });
    return res.data;
  },
};

// ─── REPORTS ──────────────────────────────────────────────────────────────────
export const reportsApi = {
  /** GET /reports/financial?start_date=...&end_date=... */
  getFinancial: async (params: {
    start_date: string;
    end_date: string;
  }): Promise<ApiSuccess<FinancialReport>> => {
    const res = await apiClient.get("/reports/financial", { params });
    return res.data;
  },
};

// ─── AUDIT LOGS ───────────────────────────────────────────────────────────────
export const auditApi = {
  /** GET /audit-logs */
  getLogs: async (): Promise<ApiSuccess<AuditLog[]>> => {
    const res = await apiClient.get("/audit-logs");
    return res.data;
  },
};
