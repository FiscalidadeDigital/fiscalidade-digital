import './globals.css';

export const metadata = {
  title: 'Fiscalidade Digital',
  description: 'Sistema Fiscal Inteligente para Angola',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}