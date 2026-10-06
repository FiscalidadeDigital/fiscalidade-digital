import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, getApiBaseUrl } from './api-base-url';

export const ADMIN_TOKEN_KEY = 'platform_admin_token';

export type PlatformAdmin = {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN';
  mustChangePassword: boolean;
};

export type AdminSession = {
  access_token: string;
  expires_in: number;
  requires_password_change: boolean;
  admin: PlatformAdmin;
};

export type AdminDashboardSummary = {
  generatedAt: string;
  tenants: {
    total: number;
    trial: number;
    active: number;
    suspended: number;
  };
  users: {
    total: number;
    active: number;
  };
  operations: {
    employees: number;
    documents: number;
    storageBytes: string;
  };
  growth: {
    periodDays: number;
    tenantsCreated: number;
    usersCreated: number;
  };
  subscriptions: {
    activeRecords: number;
    byPaymentStatus: Partial<Record<AdminPaymentStatus, number>>;
  };
  alerts: {
    expiredTrials: number;
  };
  recentAuditEvents: AdminAuditEvent[];
};

export type AdminTenantStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
export type AdminPlanType = 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
export type AdminPaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'EXPIRED'
  | 'REFUNDED';

export type AdminTenant = {
  id: string;
  name: string;
  nifMasked: string;
  emailMasked: string;
  status: AdminTenantStatus;
  planType: AdminPlanType;
  trialEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
  usage: {
    users: number;
    activeUsers: number;
    employees: number;
    documents: number;
    storageUsedBytes: string;
    storageQuotaBytes: string | null;
  };
  subscription: {
    planType: AdminPlanType;
    paymentStatus: AdminPaymentStatus;
    isActive: boolean;
    startsAt: string;
    endsAt: string;
  } | null;
};

export type AdminPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AdminTenantList = {
  data: AdminTenant[];
  pagination: AdminPagination;
};

export type AdminAuditEvent = {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  createdAt: string;
  admin: {
    id?: string;
    name: string;
    email?: string;
  } | null;
};

export type AdminAuditList = {
  data: AdminAuditEvent[];
  pagination: AdminPagination;
};

const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});

adminApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.baseURL ||= getApiBaseUrl();

  if (typeof window !== 'undefined') {
    const token = window.sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (token) {
      const headers = AxiosHeaders.from(config.headers);
      headers.set('Authorization', `Bearer ${token}`);
      config.headers = headers;
    }
  }

  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    }
    return Promise.reject(error);
  },
);

export async function loginPlatformAdmin(email: string, password: string) {
  const { data } = await adminApi.post<AdminSession>('/admin/auth/login', {
    email,
    password,
  });
  return data;
}

export async function getPlatformAdmin() {
  const { data } = await adminApi.get<{ admin: PlatformAdmin }>(
    '/admin/auth/me',
  );
  return data.admin;
}

export async function changePlatformAdminPassword(
  currentPassword: string,
  newPassword: string,
) {
  const { data } = await adminApi.post<AdminSession>(
    '/admin/auth/change-password',
    { currentPassword, newPassword },
  );
  return data;
}

export async function getAdminDashboard() {
  const { data } = await adminApi.get<AdminDashboardSummary>(
    '/admin/dashboard',
  );
  return data;
}

export async function getAdminTenants(params: {
  search?: string;
  status?: AdminTenantStatus | '';
  planType?: AdminPlanType | '';
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}) {
  const { data } = await adminApi.get<AdminTenantList>('/admin/tenants', {
    params: Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== '' && value !== undefined),
    ),
  });
  return data;
}

export async function updateAdminTenantStatus(
  tenantId: string,
  status: 'ACTIVE' | 'SUSPENDED',
  reason: string,
) {
  const { data } = await adminApi.patch<{
    id: string;
    name: string;
    status: AdminTenantStatus;
    updatedAt: string;
    changed: boolean;
  }>(`/admin/tenants/${tenantId}/status`, { status, reason });
  return data;
}

export async function getAdminAuditEvents(params: {
  action?: string;
  targetType?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}) {
  const { data } = await adminApi.get<AdminAuditList>('/admin/audit', {
    params: Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== '' && value !== undefined),
    ),
  });
  return data;
}

export function saveAdminToken(token: string) {
  window.sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

export function hasAdminToken() {
  return Boolean(window.sessionStorage.getItem(ADMIN_TOKEN_KEY));
}
