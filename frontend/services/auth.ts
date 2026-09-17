import api from './api';

import { removeToken } from '@/lib/auth';

// =====================================================
// TIPOS
// =====================================================

export type FiscalRegime =
  | 'GERAL'
  | 'SIMPLIFICADO';

export interface Tenant {
  id: string;

  name: string;

  nif: string;

  email: string;

  phone: string | null;

  address: string | null;

  sector: string | null;

  companyType: string | null;

  employeeCount: number | null;

  regime: FiscalRegime;

  retentionRate: number;

  status: string;

  planType: string;

  trialEndsAt: string | null;
}

export interface AuthUser {
  id: string;

  name: string;

  email: string;

  role: string;

  tenantId: string;

  isActive: boolean;

  lastLogin?: string | null;
}

// =====================================================
// LOGIN RESPONSE
// =====================================================

export interface LoginResponse {
  message: string;

  access_token: string;

  user: AuthUser;

  tenant: Tenant;
}

// =====================================================
// REGISTER DATA
// =====================================================

export interface RegisterData {
  companyName: string;

  ownerName: string;

  nif: string;

  email: string;

  phone?: string;

  address?: string;

  sector?: string;

  companyType: string;

  employees?: number;

  regime: FiscalRegime;

  password: string;

  acceptTerms: boolean;

  acceptPrivacyPolicy: boolean;

  confirmInformation: boolean;
}

// =====================================================
// REGISTER RESPONSE
// =====================================================

export interface RegisterResponse {
  message: string;

  access_token: string;

  user: AuthUser;

  tenant: Tenant;

  obligations: {
    automatic: boolean;

    created: number;

    updated: number;

    late: number;

    year: number;

    source: string;
  };
}

// =====================================================
// AUTH ME RESPONSE
// =====================================================

export interface CurrentUserResponse {
  user: AuthUser;

  tenant: Tenant;
}

// =====================================================
// LOGIN
// =====================================================

export const login = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  const response =
    await api.post<LoginResponse>(
      '/auth/login',
      {
        email:
          email.trim().toLowerCase(),

        password,
      },
    );

  return response.data;
};

// =====================================================
// REGISTAR EMPRESA
// =====================================================

export const register = async (
  data: RegisterData,
): Promise<RegisterResponse> => {
  const response =
    await api.post<RegisterResponse>(
      '/auth/register',
      {
        companyName:
          data.companyName.trim(),

        ownerName:
          data.ownerName.trim(),

        nif:
          data.nif
            .trim()
            .toUpperCase(),

        email:
          data.email
            .trim()
            .toLowerCase(),

        phone:
          data.phone?.trim() ||
          undefined,

        address:
          data.address?.trim() ||
          undefined,

        sector:
          data.sector?.trim() ||
          undefined,

        companyType:
          data.companyType.trim(),

        employees:
          data.employees,

        regime:
          data.regime,

        password:
          data.password,

        acceptTerms:
          data.acceptTerms,

        acceptPrivacyPolicy:
          data.acceptPrivacyPolicy,

        confirmInformation:
          data.confirmInformation,
      },
    );

  return response.data;
};

// =====================================================
// UTILIZADOR AUTENTICADO
// =====================================================

export const getCurrentUser =
  async (): Promise<CurrentUserResponse> => {
    const response =
      await api.get<CurrentUserResponse>(
        '/auth/me',
      );

    return response.data;
  };

// =====================================================
// LOGOUT
// =====================================================

export const logout = (): void => {
  removeToken();
};
