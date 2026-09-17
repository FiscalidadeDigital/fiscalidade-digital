
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
  usePathname,
  useRouter,
} from 'next/navigation';

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
// ROTAS PÚBLICAS
// =====================================================

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/terms',
  '/privacy',
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => {
    if (route === '/') {
      return pathname === '/';
    }

    return (
      pathname === route ||
      pathname.startsWith(`${route}/`)
    );
  });
}

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
// ECRÃ DE CARREGAMENTO
// =====================================================

function SecurityLoadingScreen() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: '24px',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          color: '#475569',
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            border: '4px solid #dbeafe',
            borderTopColor: '#0284c7',
            borderRadius: '50%',
            animation: 'fd-spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }}
        />

        <p
          style={{
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          A verificar a sua sessão...
        </p>
      </div>

      <style jsx>{`
        @keyframes fd-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </main>
  );
}

// =====================================================
// PROVIDER
// =====================================================

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [company, setCompany] =
    useState<Tenant | null>(null);

  const [loading, setLoading] =
    useState(true);

  const publicRoute = isPublicRoute(pathname);

  // ===================================================
  // LIMPAR SESSÃO
  // ===================================================

  const clearSession = useCallback(() => {
    logoutRequest();

    setUser(null);
    setCompany(null);
  }, []);

  // ===================================================
  // CARREGAR E VALIDAR SESSÃO
  // ===================================================

  const refreshSession = useCallback(async () => {
    setLoading(true);

    const token = getToken();

    if (!token) {
      setUser(null);
      setCompany(null);
      setLoading(false);
      return;
    }

    try {
      const session = await getCurrentUser();

      if (!session?.user || !session?.tenant) {
        throw new Error(
          'Resposta de sessão inválida.',
        );
      }

      setUser(session.user);
      setCompany(session.tenant);
    } catch (error) {
      console.error(
        'Sessão inválida ou expirada.',
        error,
      );

      clearSession();
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  // ===================================================
  // INICIALIZAÇÃO
  // ===================================================

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  // ===================================================
  // PROTECÇÃO GLOBAL DAS ROTAS
  // ===================================================

  useEffect(() => {
    if (loading) {
      return;
    }

    if (publicRoute) {
      return;
    }

    const token = getToken();

    const authenticated =
      !!token &&
      !!user &&
      !!company;

    if (!authenticated) {
      clearSession();

      const redirectPath =
        pathname && pathname !== '/login'
          ? `?redirect=${encodeURIComponent(pathname)}`
          : '';

      router.replace(`/login${redirectPath}`);
    }
  }, [
    loading,
    publicRoute,
    pathname,
    user,
    company,
    router,
    clearSession,
  ]);

  // ===================================================
  // LOGIN
  // ===================================================

  const login = useCallback(
    async (
      email: string,
      password: string,
    ) => {
      const response = await loginRequest(
        email,
        password,
      );

      if (!response?.access_token) {
        throw new Error(
          'O servidor não devolveu um token válido.',
        );
      }

      saveToken(response.access_token);

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
    async (data: RegisterData) => {
      const response =
        await registerRequest(data);

      if (!response?.access_token) {
        throw new Error(
          'O servidor não devolveu um token válido.',
        );
      }

      saveToken(response.access_token);

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
    clearSession();

    router.replace('/login');
  }, [clearSession, router]);

  // ===================================================
  // VALOR DO CONTEXT
  // ===================================================

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      company,
      loading,
      isAuthenticated:
        !!user && !!company && !!getToken(),
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

  // ===================================================
  // RENDERIZAÇÃO SEGURA
  // ===================================================

  const authenticated =
    !!user &&
    !!company &&
    !!getToken();

  if (
    !publicRoute &&
    (loading || !authenticated)
  ) {
    return (
      <AuthContext.Provider value={value}>
        <SecurityLoadingScreen />
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// =====================================================
// HOOK
// =====================================================

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth deve ser utilizado dentro de um AuthProvider.',
    );
  }

  return context;
}