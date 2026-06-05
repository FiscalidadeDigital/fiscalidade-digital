'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

interface Props {
  company: any;
  children: React.ReactNode;
}

export default function DashboardLayout({
  company,
  children,
}: Props) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header company={company} />

        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 p-8"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}