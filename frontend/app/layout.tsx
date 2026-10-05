import type {
  Metadata,
} from 'next';

import './globals.css';

import {
  AuthProvider,
} from '@/context/AuthContext';

import {
  ThemeProvider,
} from '@/context/ThemeContext';

const themeInitializationScript = `
  try {
    var preference = localStorage.getItem('fiscalidade-theme');
    var theme = preference === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (_) {
    document.documentElement.dataset.theme = 'light';
  }
`;

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
    <html lang="pt-AO" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeInitializationScript,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
