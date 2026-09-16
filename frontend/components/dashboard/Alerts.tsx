'use client';

import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface AlertItem {
  id: string;
  title: string;
  description: string;
  date?: string;
  type:
    | 'danger'
    | 'warning'
    | 'info'
    | 'success';
}

interface AlertsProps {
  alerts: AlertItem[];
}

export default function Alerts({
  alerts,
}: AlertsProps) {
  return (
    <div
      className="
        h-full
        rounded-3xl
        border border-[#e8ebf3]
        bg-white
        p-6
        shadow-sm
      "
    >
      {/* =====================================================
          CABEÇALHO
      ====================================================== */}

      <div className="flex items-center justify-between gap-4 mb-6">

        <div className="flex items-center gap-3">

          <div
            className="
              h-10
              w-10
              rounded-xl
              bg-[#fff1f1]
              text-[#ef4444]
              flex
              items-center
              justify-center
            "
          >
            <AlertTriangle
              size={19}
              strokeWidth={2}
            />
          </div>

          <div>

            <h3 className="font-bold text-[15px] text-[#111b3b]">
              Alertas Fiscais
            </h3>

            <p className="text-[11px] text-[#7180a2] mt-0.5">
              Avisos e notificações importantes
            </p>

          </div>

        </div>

        <div className="flex items-center gap-2">

          <div
            className={`
              min-w-[32px]
              h-8
              px-2
              rounded-lg
              flex
              items-center
              justify-center
              text-[11px]
              font-bold
              ${
                alerts.length > 0
                  ? 'bg-[#fff1f1] text-[#ef4444]'
                  : 'bg-[#ecfdf5] text-[#059669]'
              }
            `}
          >
            {alerts.length}
          </div>

          {alerts.length > 0 && (
            <button
              type="button"
              className="
                hidden
                sm:inline-flex
                items-center
                gap-1
                text-[11px]
                font-semibold
                text-[#5146e5]
                hover:text-[#4338ca]
              "
            >
              Ver todos
              <ArrowRight size={12} />
            </button>
          )}

        </div>

      </div>

      {/* =====================================================
          SEM ALERTAS
      ====================================================== */}

      {alerts.length === 0 ? (
        <div
          className="
            min-h-[250px]
            rounded-2xl
            border border-dashed
            border-[#dfe4ed]
            bg-[#fbfcfe]
            flex
            flex-col
            items-center
            justify-center
            text-center
            px-6
          "
        >

          <div
            className="
              h-14
              w-14
              rounded-2xl
              bg-[#ecfdf5]
              text-[#10b981]
              flex
              items-center
              justify-center
              mb-4
            "
          >
            <CheckCircle2
              size={27}
              strokeWidth={1.8}
            />
          </div>

          <h4 className="font-bold text-[14px] text-[#25365f]">
            Tudo em ordem
          </h4>

          <p className="text-[11px] text-[#7c88a1] mt-2 max-w-[240px] leading-5">
            Não existem alertas fiscais pendentes neste momento.
          </p>

        </div>
      ) : (

        /* =====================================================
           LISTA DE ALERTAS
        ====================================================== */

        <div className="space-y-3">

          {alerts.map((alert) => {

            const config = getAlertConfig(
              alert.type
            );

            const Icon = config.icon;

            return (
              <div
                key={alert.id}
                className={`
                  rounded-2xl
                  border
                  ${config.border}
                  ${config.background}
                  p-3.5
                  transition
                  hover:shadow-sm
                `}
              >

                <div className="flex gap-3">

                  {/* ÍCONE */}

                  <div
                    className={`
                      h-9
                      w-9
                      rounded-xl
                      ${config.iconBackground}
                      ${config.iconColor}
                      flex
                      items-center
                      justify-center
                      shrink-0
                    `}
                  >
                    <Icon
                      size={17}
                      strokeWidth={2}
                    />
                  </div>

                  {/* CONTEÚDO */}

                  <div className="min-w-0 flex-1">

                    <div className="flex items-start justify-between gap-3">

                      <h4
                        className="
                          text-[12px]
                          font-bold
                          text-[#25365f]
                          leading-5
                        "
                      >
                        {alert.title}
                      </h4>

                      {alert.date && (
                        <span
                          className="
                            shrink-0
                            text-[9px]
                            font-medium
                            text-[#8b96ad]
                            whitespace-nowrap
                          "
                        >
                          {alert.date}
                        </span>
                      )}

                    </div>

                    <p
                      className="
                        text-[10px]
                        text-[#7180a2]
                        mt-1
                        leading-[1.6]
                      "
                    >
                      {alert.description}
                    </p>

                  </div>

                </div>

              </div>
            );
          })}

        </div>

      )}

    </div>
  );
}

/* =====================================================
   CONFIGURAÇÃO DOS TIPOS DE ALERTA
===================================================== */

function getAlertConfig(
  type: AlertItem['type']
) {
  switch (type) {

    case 'danger':
      return {
        icon: AlertTriangle,
        border: 'border-[#fecaca]',
        background: 'bg-[#fff8f8]',
        iconBackground: 'bg-[#fee2e2]',
        iconColor: 'text-[#dc2626]',
      };

    case 'warning':
      return {
        icon: Clock,
        border: 'border-[#fed7aa]',
        background: 'bg-[#fffaf4]',
        iconBackground: 'bg-[#ffedd5]',
        iconColor: 'text-[#ea580c]',
      };

    case 'success':
      return {
        icon: CheckCircle2,
        border: 'border-[#bbf7d0]',
        background: 'bg-[#f5fff9]',
        iconBackground: 'bg-[#dcfce7]',
        iconColor: 'text-[#16a34a]',
      };

    case 'info':
    default:
      return {
        icon: Info,
        border: 'border-[#bfdbfe]',
        background: 'bg-[#f7fbff]',
        iconBackground: 'bg-[#dbeafe]',
        iconColor: 'text-[#2563eb]',
      };
  }
}