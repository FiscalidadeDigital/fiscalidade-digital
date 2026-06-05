'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import FiscalScore from '@/components/dashboard/FiscalScore';
import HealthScore from '@/components/dashboard/HealthScore';
import ExecutiveKPIs from '@/components/dashboard/ExecutiveKPIs';
import ActivityTimeline from '@/components/dashboard/ActivityTimeline';
import PieChartFiscal from '@/components/dashboard/PieChartFiscal';
import AIInsights from '@/components/dashboard/AIInsights';
import CalendarFiscal from '@/components/dashboard/CalendarFiscal';
import Alerts from '@/components/dashboard/Alerts';

export default function DashboardPage() {
  const [company, setCompany] = useState({
    name: 'Empresa XYZ',
    nif: '123456789',
    regime: 'GERAL',
    sector: 'Serviços',
  });

  return (
    <DashboardLayout company={company}>
      <Alerts />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <FiscalScore score={95} />
        <HealthScore health={90} />
        <AIInsights />
        <ExecutiveKPIs
          kpis={[
           {
  title: 'Receita Total',
  value: 2280000,
  color: 'blue',
  unit: 'AOA',
},
{
  title: 'IVA Declarado',
  value: 319200,
  color: 'green',
  unit: 'AOA',
},
{
  title: 'Impostos Pagos',
  value: 180000,
  color: 'orange',
  unit: 'AOA',
},
{
  title: 'Compliance Fiscal',
  value: 95,
  color: 'red',
  unit: '%',
},
          ]}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <PieChartFiscal />
        <CalendarFiscal />
      </div>

      <ActivityTimeline activities={[]} />
    </DashboardLayout>
  );
}