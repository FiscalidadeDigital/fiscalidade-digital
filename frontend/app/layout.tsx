import type {
  Metadata,
} from 'next';

import './globals.css';

import {
  AuthProvider,
} from '@/context/AuthContext';
import TenantRouteGate from '@/components/auth/TenantRouteGate';
import {
  ToastProvider,
} from '@/components/ui/enterprise';

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
      { url: '/icon-96.png', type: 'image/png', sizes: '96x96' },
      { url: '/icon-48.png', type: 'image/png', sizes: '48x48' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: [
      { url: '/icon-96.png', type: 'image/png', sizes: '96x96' },
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
        <link
          rel="icon"
          href="/icon-96.png"
          type="image/png"
          sizes="96x96"
        />
        <link
          rel="icon"
          href="/icon-48.png"
          type="image/png"
          sizes="48x48"
        />
        <link
          rel="shortcut icon"
          href="/icon-96.png"
          type="image/png"
          sizes="96x96"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body>
        <AuthProvider>
          <ToastProvider>
            <TenantRouteGate>
              {children}
            </TenantRouteGate>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
