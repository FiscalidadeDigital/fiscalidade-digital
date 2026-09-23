import type {
  Metadata,
} from 'next';

import './globals.css';

import {
  AuthProvider,
} from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'Fiscalidade Digital',

  description:
    'Sistema Fiscal Inteligente para Angola',

  icons: {
    icon: '/logofiscalidade.png',
    shortcut: '/logofiscalidade.png',
    apple: '/logofiscalidade.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-AO">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}