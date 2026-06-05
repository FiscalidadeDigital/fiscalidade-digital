'use client';

import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Clock3,
  ShieldAlert,
  FileWarning,
} from 'lucide-react';

const alerts = [
  {
    title: 'IVA Mensal',
    description: 'Declaração vence em 3 dias',
    severity: 'critical',
  },
  {
    title: 'IRT Trabalhadores',
    description: 'Pagamento vence em 5 dias',
    severity: 'warning',
  },
  {
    title: 'Segurança Social',
    description: 'Contribuição vence em 8 dias',
    severity: 'warning',
  },
  {
    title: 'Relatório Anual',
    description: 'Entrega pendente',
    severity: 'critical',
  },
  {
    title: 'Licença Comercial',
    description: 'Expira este mês',
    severity: 'medium',
  },
  {
    title: 'Certificado Digital',
    description: 'Renovação necessária',
    severity: 'critical',
  },
];

export default function Alerts() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="bg-white rounded-3xl shadow-lg border border-red-100 overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle size={24} />

            <div>
              <h2 className="font-bold text-lg">
                Alertas Inteligentes
              </h2>

              <p className="text-red-100 text-sm">
                Obrigações fiscais que exigem atenção
              </p>
            </div>
          </div>

          <div className="relative">
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
              }}
              className="
                w-10
                h-10
                rounded-full
                bg-white
                text-red-600
                flex
                items-center
                justify-center
                font-bold
              "
            >
              6
            </motion.div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
          {alerts.map((alert, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -4 }}
              className="
                border
                rounded-2xl
                p-4
                bg-slate-50
                hover:bg-white
                hover:shadow-lg
                transition-all
              "
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">
                    {alert.title}
                  </h3>

                  <p className="text-sm text-slate-500 mt-1">
                    {alert.description}
                  </p>
                </div>

                {alert.severity === 'critical' && (
                  <ShieldAlert className="text-red-500" size={18} />
                )}

                {alert.severity === 'warning' && (
                  <Clock3 className="text-orange-500" size={18} />
                )}

                {alert.severity === 'medium' && (
                  <FileWarning className="text-blue-500" size={18} />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}