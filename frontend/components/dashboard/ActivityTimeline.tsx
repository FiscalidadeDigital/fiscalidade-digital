'use client';

import { motion } from 'framer-motion';

import {
  Receipt,
  CheckCircle2,
  AlertTriangle,
  CalendarDays,
  Building2,
} from 'lucide-react';

interface Activity {
  id?: string;
  title: string;
  date: string;
  amount?: number;
  type?: string;
}

function formatAOA(value: number) {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ActivityTimeline({
  activities,
}: {
  activities: Activity[];
}) {
  function getIcon(type?: string) {
    switch (type) {
      case 'invoice':
        return (
          <Receipt
            size={18}
            className="text-indigo-600"
          />
        );

      case 'payment':
        return (
          <CheckCircle2
            size={18}
            className="text-emerald-600"
          />
        );

      case 'alert':
        return (
          <AlertTriangle
            size={18}
            className="text-red-600"
          />
        );

      case 'calendar':
        return (
          <CalendarDays
            size={18}
            className="text-orange-600"
          />
        );

      default:
        return (
          <Building2
            size={18}
            className="text-slate-600"
          />
        );
    }
  }

  return (
    <div className="
      rounded-2xl
      border
      border-slate-200
      bg-white
      p-6
      shadow-sm
    ">

      <div className="mb-6 flex items-center justify-between">

        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Actividade Recente
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Histórico fiscal da empresa
          </p>
        </div>

      </div>

      {activities.length === 0 ? (
        <div className="
          rounded-xl
          border
          border-dashed
          border-slate-200
          p-8
          text-center
        ">
          <p className="text-sm text-slate-500">
            Ainda não existem actividades registadas.
          </p>
        </div>
      ) : (
        <div className="relative">

          <div className="
            absolute
            bottom-0
            left-5
            top-0
            w-px
            bg-slate-200
          " />

          <div className="space-y-5">

            {activities.map(
              (activity, index) => (
                <motion.div
                  key={
                    activity.id ??
                    `${activity.date}-${index}`
                  }
                  initial={{
                    opacity: 0,
                    x: -10,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  transition={{
                    delay: index * 0.05,
                  }}
                  className="relative flex gap-4"
                >

                  <div className="
                    z-10
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-slate-200
                    bg-white
                  ">
                    {getIcon(activity.type)}
                  </div>

                  <div className="
                    flex-1
                    rounded-xl
                    bg-slate-50
                    p-4
                  ">

                    <div className="
                      flex
                      items-start
                      justify-between
                      gap-4
                    ">

                      <div>
                        <h4 className="font-semibold text-slate-800">
                          {activity.title}
                        </h4>

                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(
                            activity.date,
                          ).toLocaleDateString(
                            'pt-PT',
                          )}
                        </p>
                      </div>

                      {typeof activity.amount ===
                        'number' && (
                        <span className="whitespace-nowrap text-sm font-bold text-indigo-600">
                          {formatAOA(
                            activity.amount,
                          )}
                        </span>
                      )}

                    </div>

                  </div>

                </motion.div>
              ),
            )}

          </div>
        </div>
      )}

    </div>
  );
}