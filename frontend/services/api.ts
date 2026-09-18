
import axios, {
  AxiosHeaders,
} from 'axios';

// =====================================================
// CONFIGURAÇÃO DA API
// =====================================================

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    'https://fiscalidade-digital-api.onrender.com',

  headers: {
    'Content-Type': 'application/json',
  },

  timeout: 15000,
});

// =====================================================
// INTERCEPTOR DE REQUISIÇÕES
// =====================================================

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token =
        localStorage.getItem('token');

      if (token) {
        // Garantir que os headers são AxiosHeaders
        if (!config.headers) {
          config.headers = new AxiosHeaders();
        }

        // Adicionar token de autenticação
        config.headers.set(
          'Authorization',
          `Bearer ${token}`,
        );
      }
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  },
);

// =====================================================
// INTERCEPTOR DE RESPOSTAS
// =====================================================

api.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    const status =
      error.response?.status;

    if (status === 401) {
      if (
        typeof window !== 'undefined'
      ) {
        // Remover sessão inválida
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tenant');
        localStorage.removeItem('tenantId');

        // Evitar redireccionamento repetido
        const currentPath =
          window.location.pathname;

        if (
          !currentPath.startsWith('/login')
        ) {
          const redirect =
            encodeURIComponent(
              window.location.pathname +
                window.location.search,
            );

          window.location.replace(
            `/login?redirect=${redirect}`,
          );
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;