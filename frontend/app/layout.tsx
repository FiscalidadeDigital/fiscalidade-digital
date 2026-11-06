import type {
  Metadata,
} from 'next';

import './globals.css';

import {
  AuthProvider,
} from '@/context/AuthContext';
import TenantRouteGate from '@/components/auth/TenantRouteGate';

const siteUrl = 'https://fiscalidadedigital.ao';
const siteTitle = 'Fiscalidade Digital | Gestão fiscal para empresas em Angola';
const siteDescription = 'Acompanhe obrigações, prazos, facturas, salários e documentos da sua empresa numa plataforma feita para Angola.';

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'Fiscalidade Digital',
      url: siteUrl,
      logo: `${siteUrl}/logofiscalidade.png`,
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      name: 'Fiscalidade Digital',
      url: siteUrl,
      publisher: {
        '@id': `${siteUrl}/#organization`,
      },
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-icon.png', type: 'image/png', sizes: '180x180' },
    ],
  },
  manifest: '/manifest.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_AO',
    url: '/',
    siteName: 'Fiscalidade Digital',
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Fiscalidade Digital',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: ['/og.png'],
  },
  other: {
    'contact:email': 'fiscalidadedigital@empresa.ao',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-AO">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body>
        <AuthProvider>
          <TenantRouteGate>
            {children}
          </TenantRouteGate>
        </AuthProvider>
      </body>
    </html>
  );
}
