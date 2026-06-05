'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getCompany } from '@/services/company';

export default function CalendarPage() {
  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    loadCompany();
  }, []);

  async function loadCompany() {
    const data = await getCompany();
    setCompany(data);
  }

  if (!company) return <div>Carregando...</div>;

  return (
    <DashboardLayout company={company}>
      <h1 className="text-5xl font-bold mb-6">
        Calendário Fiscal
      </h1>

      <div className="bg-white rounded-2xl p-6 shadow">
        Calendário fiscal da empresa.
      </div>
    </DashboardLayout>
  );
}