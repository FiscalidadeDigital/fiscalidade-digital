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

  // O Render pode demorar a responder quando está a iniciar.
  timeout: 60000,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');

      if (token) {
        const headers = AxiosHeaders.from(
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

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined'
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');
      localStorage.removeItem('tenantId');
    }

    return Promise.reject(error);
  },
);

export default api;