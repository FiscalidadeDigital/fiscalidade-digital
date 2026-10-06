import { isAxiosError } from 'axios';

import api from './api';

export type TenantUserRole = 'OWNER' | 'ADMIN' | 'ACCOUNTANT' | 'VIEWER';

export type TenantUser = {
  id: string;
  name: string;
  email: string;
  role: TenantUserRole;
  isActive: boolean;
  phone: string | null;
  avatar: string | null;
  twoFactorEnabled: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserList = {
  data: TenantUser[];
  summary: { total: number; active: number; inactive: number; owners: number };
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

export type UserListQuery = {
  search?: string;
  role?: TenantUserRole | '';
  status?: 'ACTIVE' | 'INACTIVE' | '';
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'email' | 'role' | 'createdAt' | 'lastLogin';
  sortDirection?: 'asc' | 'desc';
};

export async function getTenantUsers(query: UserListQuery) {
  const response = await api.get<UserList>('/users', {
    params: Object.fromEntries(
      Object.entries(query).filter(([, value]) => value !== '' && value !== undefined),
    ),
  });
  return response.data;
}

export async function updateTenantUserAccess(
  userId: string,
  input: { role?: TenantUserRole; isActive?: boolean; reason: string },
) {
  const response = await api.patch<TenantUser & { changed: boolean }>(
    `/users/${userId}/access`,
    input,
  );
  return response.data;
}

export async function createTenantInvitation(input: { email: string; role: Exclude<TenantUserRole, 'OWNER'> }) {
  const response = await api.post('/auth/invitations', input);
  return response.data as { message: string };
}

export function getUserApiError(error: unknown, fallback: string) {
  if (!isAxiosError<{ message?: string | string[] }>(error)) return fallback;
  const message = error.response?.data?.message;
  if (Array.isArray(message)) return message.join(' ');
  return message || fallback;
}
