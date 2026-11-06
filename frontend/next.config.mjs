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

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
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
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.fiscalidadedigital.ao',
          },
        ],
        destination: 'https://fiscalidadedigital.ao/:path*',
        permanent: true,
      },
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
};

export default nextConfig;
