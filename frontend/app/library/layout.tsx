import DashboardLayout from '@/components/layout/DashboardLayout';

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}