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

import api from '@/services/api';
import {
  getToken,
  removeToken,
  saveToken,
} from '@/lib/auth';

/* ============================================================
   TIPOS
============================================================ */

export type User = {
  id: string;
  email: string;
  name?: string;
  role?: string;
  isActive?: boolean;
  tenantId?: string;
  [key: string]: unknown;
};

export type Tenant = {
  id: string;
  name?: string;
  nif?: string;
  email?: string;
  phone?: string;
  [key: string]: unknown;
};

export type LoginResponse = {
  access_token: string;
  user: User;
  tenant: Tenant;
};

export type RegisterResponse = {
  access_token?: string;
  user?: User;
  tenant?: Tenant;
  message?: string;
  [key: string]: unknown;
};

export type AuthContextType = {
  user: User | null;
  company: Tenant | null;

  loading: boolean;
  initialized: boolean;
  isAuthenticated: boolean;

  login: (
    email: string,
    password: string,
  ) => Promise<LoginResponse>;

  register: (
    data: Record<string, unknown>,
  ) => Promise<RegisterResponse>;

  logout: () => void;

  refreshSession: () => Promise<void>;
};

/* ============================================================
   CONTEXT
============================================================ */

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined,
  );

/* ============================================================
   PROVIDER
============================================================ */

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [company, setCompany] =
    useState<Tenant | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [initialized, setInitialized] =
    useState(false);

  /* ==========================================================
     GUARDAR SESSÃO
  ========================================================== */

  const saveSession = useCallback(
    (
      sessionUser: User,
      sessionTenant: Tenant,
    ) => {
      setUser(sessionUser);
      setCompany(sessionTenant);

      if (
        typeof window !== 'undefined'
      ) {
        localStorage.setItem(
          'user',
          JSON.stringify(sessionUser),
        );

        localStorage.setItem(
          'tenant',
          JSON.stringify(sessionTenant),
        );

        localStorage.setItem(
          'tenantId',
          sessionTenant.id,
        );
      }
    },
    [],
  );

  /* ==========================================================
     LIMPAR SESSÃO
  ========================================================== */

  const clearSession = useCallback(() => {
    removeToken();

    setUser(null);
    setCompany(null);

    if (
      typeof window !== 'undefined'
    ) {
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');
      localStorage.removeItem('tenantId');
    }
  }, []);

  /* ==========================================================
     RECUPERAR SESSÃO
  ========================================================== */

  const refreshSession =
    useCallback(async () => {
      const token = getToken();

      /*
       * Não existe token.
       * Portanto não existe sessão para restaurar.
       */

      if (!token) {
        setUser(null);
        setCompany(null);
        setLoading(false);
        setInitialized(true);

        return;
      }

      try {
        setLoading(true);

        /*
         * Consulta:
         *
         * GET /auth/me
         */

        const response =
          await api.get('/auth/me');

        const data = response?.data;

        /*
         * O backend pode devolver:
         *
         * {
         *   user,
         *   tenant
         * }
         *
         * ou, dependendo da implementação,
         * o próprio user.
         */

        const currentUser =
          data?.user ?? data;

        const currentTenant =
          data?.tenant ??
          data?.company ??
          data?.tenantData;

        /*
         * Se o backend não devolver os dois,
         * tentamos recuperar o tenant do localStorage.
         */

        let tenantFromStorage:
          | Tenant
          | null = null;

        if (
          typeof window !== 'undefined'
        ) {
          const storedTenant =
            localStorage.getItem(
              'tenant',
            );

          if (storedTenant) {
            try {
              tenantFromStorage =
                JSON.parse(
                  storedTenant,
                );
            } catch {
              tenantFromStorage = null;
            }
          }
        }

        const finalTenant =
          currentTenant ??
          tenantFromStorage;

        if (
          !currentUser ||
          !finalTenant
        ) {
          throw new Error(
            'Sessão inválida.',
          );
        }

        saveSession(
          currentUser,
          finalTenant,
        );
      } catch (error) {
        console.error(
          'Erro ao restaurar sessão:',
          error,
        );

        clearSession();
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    }, [
      clearSession,
      saveSession,
    ]);

  /* ==========================================================
     LOGIN
  ========================================================== */

  const login = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<LoginResponse> => {
      setLoading(true);

      try {
        /*
         * POST /auth/login
         */

        const response =
          await api.post(
            '/auth/login',
            {
              email,
              password,
            },
          );

        const data =
          response?.data as LoginResponse;

        /*
         * Verificar token.
         */

        if (
          !data?.access_token
        ) {
          throw new Error(
            'O servidor não devolveu um token de autenticação.',
          );
        }

        /*
         * Verificar utilizador.
         */

        if (!data?.user) {
          throw new Error(
            'O servidor não devolveu os dados do utilizador.',
          );
        }

        /*
         * Verificar empresa/tenant.
         */

        if (!data?.tenant) {
          throw new Error(
            'O servidor não devolveu os dados da empresa.',
          );
        }

        /*
         * Guardar TOKEN.
         */

        saveToken(
          data.access_token,
        );

        /*
         * Guardar USER + TENANT
         * no estado React e localStorage.
         */

        saveSession(
          data.user,
          data.tenant,
        );

        /*
         * A sessão já está inicializada.
         */

        setInitialized(true);

        return data;
      } catch (error) {
        console.error(
          'Erro no login:',
          error,
        );

        clearSession();

        throw error;
      } finally {
        setLoading(false);
      }
    },
    [
      clearSession,
      saveSession,
    ],
  );

  /* ==========================================================
     REGISTO
  ========================================================== */

  const register = useCallback(
    async (
      data: Record<string, unknown>,
    ): Promise<RegisterResponse> => {
      setLoading(true);

      try {
        /*
         * POST /auth/register
         */

        const response =
          await api.post(
            '/auth/register',
            data,
          );

        const result =
          response?.data as RegisterResponse;

        /*
         * Caso o backend faça login automático
         * depois do registo.
         */

        if (
          result?.access_token &&
          result?.user &&
          result?.tenant
        ) {
          saveToken(
            result.access_token,
          );

          saveSession(
            result.user,
            result.tenant,
          );
        }

        setInitialized(true);

        return result;
      } catch (error) {
        console.error(
          'Erro no registo:',
          error,
        );

        throw error;
      } finally {
        setLoading(false);
      }
    },
    [saveSession],
  );

  /* ==========================================================
     LOGOUT
  ========================================================== */

  const logout = useCallback(() => {
    clearSession();

    setInitialized(true);

    if (
      typeof window !== 'undefined'
    ) {
      window.location.href =
        '/login';
    }
  }, [clearSession]);

  /* ==========================================================
     INICIALIZAÇÃO
  ========================================================== */

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  /* ==========================================================
     AUTENTICAÇÃO
  ========================================================== */

  const token =
    typeof window !== 'undefined'
      ? getToken()
      : null;

  const isAuthenticated =
    Boolean(token) &&
    Boolean(user) &&
    Boolean(company);

  /* ==========================================================
     VALUE
  ========================================================== */

  const value =
    useMemo<AuthContextType>(
      () => ({
        user,
        company,

        loading,
        initialized,
        isAuthenticated,

        login,
        register,

        logout,
        refreshSession,
      }),
      [
        user,
        company,

        loading,
        initialized,
        isAuthenticated,

        login,
        register,

        logout,
        refreshSession,
      ],
    );

  /* ==========================================================
     PROVIDER
  ========================================================== */

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ============================================================
   HOOK
============================================================ */

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth deve ser usado dentro de um AuthProvider.',
    );
  }

  return context;
}