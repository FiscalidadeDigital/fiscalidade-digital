import axios, {
  AxiosHeaders,
  type InternalAxiosRequestConfig,
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

  // Tempo para o Render acordar e responder
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
        // Normaliza os headers para AxiosHeaders
        const headers = AxiosHeaders.from(
          config.headers,
        );

        // Adiciona o token de autenticação
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
// INTERCEPTOR DE RESPOSTAS
// =====================================================

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error.response?.status;

    // Remover sessão apenas quando o token for inválido
    if (
      status === 401 &&
      typeof window !== 'undefined'
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');
      localStorage.removeItem('tenantId');
    }

    // Registar erros de timeout
    if (error.code === 'ECONNABORTED') {
      console.error(
        'A API demorou demasiado tempo a responder.',
      );
    }

    return Promise.reject(error);
  },
);

export default api;