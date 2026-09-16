import axios from 'axios';

const api = axios.create({
  baseURL: 'https://fiscalidade-digital-api.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token =
        localStorage.getItem('token');

      if (token) {
        config.headers.Authorization =
          `Bearer ${token}`;
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
      error.response?.status === 401
    ) {
      if (
        typeof window !== 'undefined'
      ) {
        localStorage.removeItem(
          'token',
        );
        localStorage.removeItem(
          'user',
        );
      }
    }

    return Promise.reject(error);
  },
);

export default api;
