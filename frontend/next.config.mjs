/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
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
    ];
  },
};

export default nextConfig;
