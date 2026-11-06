import type { MetadataRoute } from 'next';

const siteUrl = 'https://fiscalidadedigital.ao';

const privatePaths = [
  '/accounting',
  '/admin',
  '/assistant',
  '/calendar',
  '/clients',
  '/company',
  '/dashboard',
  '/electronic-invoicing',
  '/employees',
  '/first-access',
  '/fiscal-enrollments',
  '/fiscal-situation',
  '/history',
  '/invoice',
  '/invoices',
  '/legislation',
  '/library',
  '/notifications',
  '/obligations',
  '/onboarding',
  '/payments',
  '/payroll',
  '/products',
  '/pro-formas',
  '/purchase-invoices',
  '/reports',
  '/revenue',
  '/settings',
  '/simulator',
  '/suppliers',
  '/users',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: privatePaths,
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
