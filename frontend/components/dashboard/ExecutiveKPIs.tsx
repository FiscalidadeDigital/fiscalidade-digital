'use client';

import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Landmark,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface KPIProps {
  title: string;
  value: number;
  unit?: string;
  color: 'blue' | 'green' | 'orange' | 'red';
}

export default function ExecutiveKPIs({
  kpis,
}: {
  kpis: KPIProps[];
}) {
  const icons = [
    Wallet,
    Landmark,
    ShieldCheck,
    AlertCircle,
  ];

  const gradients = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    orange: 'from-orange-500 to-amber-500',
    red: 'from-red-500 to-pink-500',
  };

  const trends = [
    { value: '+18%', positive: true },
    { value: '+12%', positive: true },
    { value: '+6%', positive: true },
    { value: '-2%', positive: false },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {kpis.map((kpi, idx) => {
        const Icon = icons[idx];
        const trend = trends[idx];

        return (
          <motion.div
            key={idx}
            whileHover={{
              y: -5,
              scale: 1.02,
            }}
            className="
              bg-white
              rounded-3xl
              shadow-xl
              border
              border-slate-100
              overflow-hidden
              relative
            "
          >
            <div
              className={`
                h-2
                bg-gradient-to-r
                ${gradients[kpi.color]}
              `}
            />

            <div className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-500 text-sm">
                    {kpi.title}
                  </p>

                  <h2 className="text-3xl font-bold mt-2 text-slate-800">
                    {kpi.value.toLocaleString()}
                  </h2>

                  {kpi.unit && (
                    <span className="text-xs text-slate-400">
                      {kpi.unit}
                    </span>
                  )}
                </div>

                <div
                  className={`
                    w-12
                    h-12
                    rounded-2xl
                    bg-gradient-to-r
                    ${gradients[kpi.color]}
                    flex
                    items-center
                    justify-center
                    text-white
                    shadow-lg
                  `}
                >
                  <Icon size={22} />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                {trend.positive ? (
                  <TrendingUp
                    size={16}
                    className="text-green-500"
                  />
                ) : (
                  <TrendingDown
                    size={16}
                    className="text-red-500"
                  />
                )}

                <span
                  className={
                    trend.positive
                      ? 'text-green-600 text-sm font-semibold'
                      : 'text-red-600 text-sm font-semibold'
                  }
                >
                  {trend.value}
                </span>

                <span className="text-xs text-slate-400">
                  vs mês anterior
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}