
import axios, {
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from 'axios';

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    'https://fiscalidade-digital-api.onrender.com',

  headers: {
    'Content-Type': 'application/json',
  },

  // Permitir tempo para o Render iniciar a API
  timeout: 60000,
});

// =====================================================
// INTERCEPTOR DE PEDIDOS
// =====================================================

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');

      if (token) {
        if (!config.headers) {
          config.headers = new AxiosHeaders();
        }

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
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tenant');
        localStorage.removeItem('tenantId');
      }
    }

    return Promise.reject(error);
  },
);

export default api;