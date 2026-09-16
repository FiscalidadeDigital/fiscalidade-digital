'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

import {
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';

interface Payment {
  month: string;
  value: number;
}

interface PaymentEvolutionProps {
  payments?: Payment[];
}

export default function PaymentEvolution({
  payments,
}: PaymentEvolutionProps) {
  const safePayments = Array.isArray(payments)
    ? payments.filter(
        (payment) =>
          payment &&
          typeof payment.month === 'string'
      )
    : [];

  const total = safePayments.reduce(
    (sum, payment) =>
      sum + Number(payment.value || 0),
    0
  );

  const hasPayments = safePayments.some(
    (payment) =>
      Number(payment.value || 0) > 0
  );

  const formatCurrency = (value: number) => {
    return Number(value || 0).toLocaleString(
      'pt-AO',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    );
  };

  const formatAxisValue = (value: number) => {
    const number = Number(value || 0);

    if (number >= 1_000_000) {
      return `${(number / 1_000_000).toFixed(1)}M`;
    }

    if (number >= 1_000) {
      return `${Math.round(number / 1_000)}K`;
    }

    return String(number);
  };

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
      {/* CABEÇALHO */}

      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-[#ecfdf5]
              text-[#10b981]
            "
          >
            <TrendingUp
              size={19}
              strokeWidth={2}
            />
          </div>

          <div>
            <h3 className="text-[15px] font-bold text-[#111b3b]">
              Pagamentos fiscais
            </h3>

            <p className="mt-0.5 text-[11px] text-[#7180a2]">
              Valores pagos pela empresa
            </p>
          </div>
        </div>

        <div
          className="
            rounded-lg
            border
            border-[#e4e7ef]
            bg-white
            px-3
            py-2
            text-[10px]
            font-semibold
            text-[#526080]
          "
        >
          2026
        </div>
      </div>

      {/* TOTAL */}

      {hasPayments && (
        <div
          className="
            mb-4
            flex
            items-center
            justify-between
            rounded-xl
            border
            border-[#edf0f5]
            bg-[#fafbfe]
            px-4
            py-3
          "
        >
          <div>
            <span className="block text-[9px] font-medium text-[#8a96b0]">
              Total pago
            </span>

            <span className="mt-1 block text-[13px] font-bold text-[#25365f]">
              AOA {formatCurrency(total)}
            </span>
          </div>

          <div
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              bg-[#ecfdf5]
              text-[#10b981]
            "
          >
            <ArrowUpRight size={15} />
          </div>
        </div>
      )}

      {/* GRÁFICO */}

      <div className="h-[245px]">
        {!hasPayments ? (
          <div
            className="
              flex
              h-full
              items-center
              justify-center
              rounded-2xl
              border
              border-dashed
              border-[#dfe4ed]
              bg-[#fbfcfe]
              px-6
              text-center
            "
          >
            <div>
              <div
                className="
                  mx-auto
                  mb-3
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#f0edff]
                  text-[#5146e5]
                "
              >
                <TrendingUp
                  size={22}
                  strokeWidth={1.8}
                />
              </div>

              <p className="text-[12px] font-semibold text-[#526080]">
                Não há pagamentos registados
              </p>

              <p className="mt-1 text-[10px] text-[#8a96b0]">
                Os pagamentos efetuados aparecerão neste histórico.
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={safePayments}
              margin={{
                top: 10,
                right: 8,
                left: -15,
                bottom: 0,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 5"
                vertical={false}
                stroke="#edf0f5"
              />

              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 10,
                  fill: '#8a96b0',
                }}
                dy={8}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 9,
                  fill: '#8a96b0',
                }}
                tickFormatter={formatAxisValue}
              />

              <Tooltip
                cursor={{
                  stroke: '#dcd9ff',
                  strokeWidth: 1,
                }}
                contentStyle={{
                  borderRadius: '10px',
                  border: '1px solid #e8ebf3',
                  boxShadow:
                    '0 8px 25px rgba(15, 27, 61, 0.08)',
                  fontSize: '11px',
                }}
                formatter={(value) =>
                  `AOA ${formatCurrency(
                    Number(value ?? 0)
                  )}`
                }
                labelStyle={{
                  color: '#25365f',
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              />

              <Line
                type="monotone"
                dataKey="value"
                stroke="#5146e5"
                strokeWidth={3}
                dot={{
                  r: 3.5,
                  fill: '#5146e5',
                  strokeWidth: 2,
                  stroke: '#ffffff',
                }}
                activeDot={{
                  r: 6,
                  fill: '#5146e5',
                  stroke: '#ffffff',
                  strokeWidth: 3,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}