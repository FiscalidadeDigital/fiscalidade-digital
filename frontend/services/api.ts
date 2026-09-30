import axios, {
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from 'axios';
import { API_BASE_URL } from './api-base-url';

const api = axios.create({
  baseURL: API_BASE_URL,

  headers: {
    'Content-Type': 'application/json',
  },

  timeout: 60000,
});

// =====================================================
// REQUEST INTERCEPTOR
// =====================================================

api.interceptors.request.use(
  (
    config: InternalAxiosRequestConfig,
  ) => {
    if (
      typeof window !== 'undefined'
    ) {
      const token =
        localStorage.getItem('token');

      if (token) {
        const headers =
          AxiosHeaders.from(
            config.headers,
          );

        headers.set(
          'Authorization',
          `Bearer ${token}`,
        );

        config.headers = headers;
      }
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  },
);

// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined'
    ) {
      localStorage.removeItem(
        'token',
      );

      localStorage.removeItem(
        'user',
      );

      localStorage.removeItem(
        'tenant',
      );

      localStorage.removeItem(
        'tenantId',
      );
    }

    return Promise.reject(error);
  },
);

export default api;
