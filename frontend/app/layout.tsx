
import './globals.css';

import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
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
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}