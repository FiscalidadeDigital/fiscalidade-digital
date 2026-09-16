'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  getCurrentUser,
  login as loginRequest,
  register as registerRequest,
  logout as logoutRequest,
  type AuthUser,
  type Tenant,
  type LoginResponse,
  type RegisterData,
  type RegisterResponse,
} from '@/services/auth';

import {
  getToken,
  saveToken,
} from '@/lib/auth';

// =====================================================
// TIPOS
// =====================================================

interface AuthContextValue {
  user: AuthUser | null;

  company: Tenant | null;

  loading: boolean;

  isAuthenticated: boolean;

  login: (
    email: string,
    password: string,
  ) => Promise<LoginResponse>;

  register: (
    data: RegisterData,
  ) => Promise<RegisterResponse>;

  refreshSession: () => Promise<void>;

  logout: () => void;
}

// =====================================================
// CONTEXT
// =====================================================

const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined,
  );

// =====================================================
// PROVIDER
// =====================================================

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [company, setCompany] =
    useState<Tenant | null>(null);

  const [loading, setLoading] =
    useState(true);

  // ===================================================
  // CARREGAR SESSÃO
  // ===================================================

  const refreshSession =
    useCallback(async () => {
      const token = getToken();

      if (!token) {
        setUser(null);
        setCompany(null);
        setLoading(false);
        return;
      }

      try {
        const session =
          await getCurrentUser();

        setUser(session.user);

        setCompany(session.tenant);
      } catch (error) {
        console.error(
          'Erro ao recuperar sessão:',
          error,
        );

        setUser(null);
        setCompany(null);
      } finally {
        setLoading(false);
      }
    }, []);

  // ===================================================
  // INICIALIZAÇÃO
  // ===================================================

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  // ===================================================
  // LOGIN
  // ===================================================

  const login = useCallback(
    async (
      email: string,
      password: string,
    ) => {
      const response =
        await loginRequest(
          email,
          password,
        );

      saveToken(
        response.access_token,
      );

      setUser(response.user);

      setCompany(response.tenant);

      return response;
    },
    [],
  );

  // ===================================================
  // REGISTO
  // ===================================================

  const register = useCallback(
    async (
      data: RegisterData,
    ) => {
      const response =
        await registerRequest(data);

      saveToken(
        response.access_token,
      );

      setUser(response.user);

      setCompany(response.tenant);

      return response;
    },
    [],
  );

  // ===================================================
  // LOGOUT
  // ===================================================

  const logout = useCallback(() => {
    logoutRequest();

    setUser(null);

    setCompany(null);
  }, []);

  // ===================================================
  // VALOR DO CONTEXT
  // ===================================================

  const value =
    useMemo<AuthContextValue>(
      () => ({
        user,

        company,

        loading,

        isAuthenticated:
          !!user && !!company,

        login,

        register,

        refreshSession,

        logout,
      }),
      [
        user,
        company,
        loading,
        login,
        register,
        refreshSession,
        logout,
      ],
    );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

// =====================================================
// HOOK
// =====================================================

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth deve ser utilizado dentro de um AuthProvider.',
    );
  }

  return context;
}