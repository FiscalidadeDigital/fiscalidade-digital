const noIndexRoutes = [
  '/accounting/:path*',
  '/admin/:path*',
  '/assistant/:path*',
  '/calendar/:path*',
  '/clients/:path*',
  '/company/:path*',
  '/dashboard/:path*',
  '/electronic-invoicing/:path*',
  '/employees/:path*',
  '/first-access/:path*',
  '/fiscal-enrollments/:path*',
  '/fiscal-situation/:path*',
  '/history/:path*',
  '/invoice/:path*',
  '/invoices/:path*',
  '/legislation/:path*',
  '/library/:path*',
  '/notifications/:path*',
  '/obligations/:path*',
  '/onboarding/:path*',
  '/payments/:path*',
  '/payroll/:path*',
  '/products/:path*',
  '/pro-formas/:path*',
  '/purchase-invoices/:path*',
  '/reports/:path*',
  '/revenue/:path*',
  '/settings/:path*',
  '/simulator/:path*',
  '/suppliers/:path*',
  '/users/:path*',
];

const apiProxyTarget = (
  process.env.API_PROXY_URL ||
  'https://fiscalidade-digital-api.onrender.com'
).replace(/\/+$/, '');

// Os URLs de preview da Vercel são dinâmicos. Ao encaminhar os pedidos da
// aplicação pelo mesmo domínio, não é necessário abrir o CORS do backend a
// cada novo preview e os pedidos de autenticação mantêm-se privados da API.
const useVercelApiProxy = process.env.VERCEL === '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  env: useVercelApiProxy
    ? {
        NEXT_PUBLIC_API_URL: '/api',
      }
    : {},
  experimental: {
    workerThreads: true,
    webpackBuildWorker: false,
  },
  async headers() {
    return noIndexRoutes.map((source) => ({
      source,
      headers: [
        {
          key: 'X-Robots-Tag',
          value: 'noindex, nofollow, noarchive',
        },
      ],
    }));
  },
  async redirects() {
    return [
      {
        source: '/invoice',
        destination: '/invoices',
        permanent: false,
      },
      {
        source: '/invoice/new',
        destination: '/invoices/new',
        permanent: false,
      },
      {
        source: '/documents',
        destination: '/library',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    if (!useVercelApiProxy) {
      return [];
    }

    return [
      {
        source: '/api/:path*',
        destination: `${apiProxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
