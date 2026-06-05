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
  title: string;
  date: string;
  amount?: number;
  type?: string;
}

const demoActivities: Activity[] = [
  {
    title: 'Factura FT-2026-00021 emitida',
    date: '2026-06-05',
    amount: 450000,
    type: 'invoice',
  },
  {
    title: 'Pagamento IVA registado',
    date: '2026-06-04',
    amount: 320000,
    type: 'payment',
  },
  {
    title: 'Alerta Fiscal gerado',
    date: '2026-06-03',
    type: 'alert',
  },
  {
    title: 'Segurança Social próxima do vencimento',
    date: '2026-06-02',
    type: 'calendar',
  },
  {
    title: 'Empresa actualizou cadastro',
    date: '2026-06-01',
    type: 'company',
  },
];

export default function ActivityTimeline({
  activities,
}: {
  activities: Activity[];
}) {
  const data =
    activities.length > 0
      ? activities
      : demoActivities;

  function getIcon(type?: string) {
    switch (type) {
      case 'invoice':
        return (
          <Receipt
            size={18}
            className="text-blue-600"
          />
        );

      case 'payment':
        return (
          <CheckCircle2
            size={18}
            className="text-green-600"
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
    <div
      className="
        bg-white
        rounded-3xl
        shadow-xl
        border
        border-slate-200
        p-6
      "
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-800">
            Actividade Recente
          </h3>

          <p className="text-slate-500 text-sm">
            Histórico fiscal da empresa
          </p>
        </div>

        <div
          className="
            bg-blue-50
            text-blue-700
            px-4
            py-2
            rounded-xl
            text-sm
            font-medium
          "
        >
          Últimos eventos
        </div>
      </div>

      <div className="relative">

        <div
          className="
            absolute
            left-5
            top-0
            bottom-0
            w-[2px]
            bg-slate-200
          "
        />

        <div className="space-y-6">

          {data.map((activity, index) => (
            <motion.div
              key={index}
              initial={{
                opacity: 0,
                x: -20,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                duration: 0.4,
                delay: index * 0.1,
              }}
              className="
                relative
                flex
                gap-4
              "
            >
              <div
                className="
                  w-10
                  h-10
                  rounded-full
                  bg-white
                  border-2
                  border-slate-200
                  flex
                  items-center
                  justify-center
                  z-10
                "
              >
                {getIcon(activity.type)}
              </div>

              <div
                className="
                  flex-1
                  bg-slate-50
                  hover:bg-slate-100
                  transition
                  rounded-2xl
                  p-4
                "
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-slate-800">
                      {activity.title}
                    </h4>

                    <p className="text-sm text-slate-500 mt-1">
                      {new Date(
                        activity.date
                      ).toLocaleDateString(
                        'pt-PT'
                      )}
                    </p>
                  </div>

                  {activity.amount && (
                    <div
                      className="
                        font-bold
                        text-blue-700
                      "
                    >
                      {activity.amount.toLocaleString()}
                      {' '}
                      AOA
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

        </div>
      </div>
    </div>
  );
}