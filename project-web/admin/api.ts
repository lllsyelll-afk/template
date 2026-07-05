import { api } from "../utils/client";

export interface AdminUser {
  _id: string;
  name: string;
  photo?: string | null;
  email?: string | null;
  phone: string;
  blocked: boolean;
  permissions?: string[];
  verified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminExpense {
  _id: string;
  photo: string;
  description: string;
  amount: number;
  approvalLink: string;
  createdBy: string;
  creator: {
    _id: string;
    name: string;
    photo?: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminAuditLog {
  _id: string;
  adminId: string;
  adminName: string;
  action: string;
  method: string;
  path: string;
  resource: string;
  targetId?: string;
  body?: unknown;
  status: number;
  ip: string;
  createdAt: Date;
}

export const adminApi = {
  // Users
  getUsers: (page = 1, limit = 10) =>
    api.get<{ users: AdminUser[]; total: number; page: number; limit: number; totalPages: number }>(
      `/admin/users?page=${page}&limit=${limit}`,
    ),
  getUser: (id: string) => api.get<{ user: AdminUser }>(`/admin/users/${id}`),
  blockUser: (id: string, blocked: boolean) =>
    api.patch<{ user: AdminUser }>(`/admin/users/${id}/block`, { blocked }),
  updateUser: (id: string, data: Partial<AdminUser>) =>
    api.patch<{ user: AdminUser }>(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.del<{ ok: true }>(`/admin/users/${id}`),

  // Expenses
  getExpenses: (page = 1, limit = 10) =>
    api.get<{ invoices: AdminExpense[]; total: number; page: number; limit: number; totalPages: number }>(
      `/admin/expenses?page=${page}&limit=${limit}`,
    ),
  getExpense: (id: string) =>
    api.get<{ invoice: AdminExpense }>(`/admin/expenses/${id}`),
  createExpense: (data: {
    photo?: string;
    description?: string;
    amount?: number;
    approvalLink?: string;
  }) => api.post<{ invoice: AdminExpense }>("/admin/expenses", data),
  updateExpense: (id: string, data: Partial<AdminExpense>) =>
    api.patch<{ invoice: AdminExpense }>(`/admin/expenses/${id}`, data),
  deleteExpense: (id: string) =>
    api.del<{ message: string }>(`/admin/expenses/${id}`),

  // Audit Logs
  getAuditLogs: (page = 1, limit = 20, filters?: { action?: string; resource?: string }) =>
    api.get<{ logs: AdminAuditLog[]; total: number }>(
      `/admin/audit-logs?page=${page}&limit=${limit}${
        filters?.action ? `&action=${filters.action}` : ""
      }${filters?.resource ? `&resource=${filters.resource}` : ""}`,
    ),
};
