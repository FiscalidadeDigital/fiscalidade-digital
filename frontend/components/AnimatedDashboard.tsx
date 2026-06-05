// frontend/components/AnimatedDashboard.tsx
'use client';
import React from 'react';
import dynamic from 'next/dynamic';

// Carrega ApexCharts dinamicamente para não quebrar o SSR
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface AnimatedDashboardProps {
  revenueData: number[];
  months: string[];
  pendingInvoices: number[];
}

const AnimatedDashboard: React.FC<AnimatedDashboardProps> = ({
  revenueData,
  months,
  pendingInvoices,
}) => {
  const chartOptions = {
    chart: {
      id: 'revenue-chart',
      animations: {
        enabled: true,
        easing: 'easeinout',
        dynamicAnimation: {
          speed: 800,
        },
      },
    },
    xaxis: {
      categories: months,
    },
    yaxis: {
      title: {
        text: 'AOA',
      },
    },
    dataLabels: {
      enabled: false,
    },
  };

  const series = [
    {
      name: 'Receita',
      data: revenueData,
    },
    {
      name: 'Facturas Pendentes',
      data: pendingInvoices,
    },
  ];

  return (
    <div className="animated-dashboard">
      <Chart options={chartOptions} series={series} type="line" height={350} />
    </div>
  );
};

export default AnimatedDashboard;