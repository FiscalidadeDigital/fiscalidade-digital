'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import {
  ReceiptText,
} from 'lucide-react';

interface Tax {
  name: string;
  value: number;
}

interface FiscalSummaryProps {
  taxes?: Tax[];
}

const COLORS = [
  '#5146e5',
  '#3b82f6',
  '#f59e0b',
  '#10b981',
  '#94a3b8',
];

export default function FiscalSummary({
  taxes,
}: FiscalSummaryProps) {
  const safeTaxes = Array.isArray(taxes)
    ? taxes
        .filter(
          (tax) =>
            tax &&
            typeof tax.name === 'string'
        )
        .map((tax) => ({
          name: tax.name,
          value: Number(tax.value || 0),
        }))
        .filter(
          (tax) => tax.value > 0
        )
    : [];

  const total = safeTaxes.reduce(
    (sum, tax) =>
      sum + tax.value,
    0
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

  const getPercentage = (value: number) => {
    if (total <= 0) {
      return 0;
    }

    return Number(
      ((value / total) * 100).toFixed(1)
    );
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

      <div className="mb-6 flex items-center gap-3">
        <div
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            bg-[#f0edff]
            text-[#5146e5]
          "
        >
          <ReceiptText
            size={19}
            strokeWidth={2}
          />
        </div>

        <div>
          <h3 className="text-[15px] font-bold text-[#111b3b]">
            Impostos registados
          </h3>

          <p className="mt-0.5 text-[11px] text-[#7180a2]">
            Valores fiscais registados no sistema
          </p>
        </div>
      </div>

      {/* SEM DADOS */}

      {safeTaxes.length === 0 ? (
        <div
          className="
            flex
            min-h-[260px]
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
              <ReceiptText
                size={22}
                strokeWidth={1.8}
              />
            </div>

            <p className="text-[12px] font-semibold text-[#526080]">
              Ainda não existem valores fiscais
            </p>

            <p className="mt-1 text-[10px] leading-5 text-[#8a96b0]">
              Os valores serão apresentados quando
              existirem registos fiscais da empresa.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div
            className="
              grid
              grid-cols-1
              items-center
              gap-6
              sm:grid-cols-[170px_1fr]
            "
          >
            {/* GRÁFICO */}

            <div className="flex justify-center">
              <div className="relative h-[170px] w-[170px]">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>
                    <Pie
                      data={safeTaxes}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={53}
                      outerRadius={75}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {safeTaxes.map(
                        (_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              COLORS[
                                index %
                                  COLORS.length
                              ]
                            }
                          />
                        )
                      )}
                    </Pie>

                    <Tooltip
                      contentStyle={{
                        borderRadius: '10px',
                        border:
                          '1px solid #e8ebf3',
                        boxShadow:
                          '0 8px 25px rgba(15, 27, 61, 0.08)',
                        fontSize: '11px',
                      }}
                      formatter={(value) =>
                        `AOA ${formatCurrency(
                          Number(value ?? 0)
                        )}`
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* TOTAL NO CENTRO */}

                <div
                  className="
                    pointer-events-none
                    absolute
                    inset-0
                    flex
                    flex-col
                    items-center
                    justify-center
                  "
                >
                  <span className="text-[9px] font-medium text-[#8a96b0]">
                    Total
                  </span>

                  <strong className="mt-1 text-[12px] font-bold text-[#25365f]">
                    AOA
                  </strong>

                  <span className="mt-0.5 text-[13px] font-extrabold text-[#111b3b]">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>

            {/* LISTA */}

            <div className="space-y-2.5">
              {safeTaxes.map(
                (tax, index) => {
                  const percentage =
                    getPercentage(
                      tax.value
                    );

                  return (
                    <div
                      key={`${tax.name}-${index}`}
                      className="
                        flex
                        items-center
                        justify-between
                        gap-3
                        rounded-xl
                        border
                        border-transparent
                        px-3
                        py-2.5
                        transition
                        hover:border-[#edf0f5]
                        hover:bg-[#fafbfe]
                      "
                    >
                      <div
                        className="
                          flex
                          min-w-0
                          items-center
                          gap-2.5
                        "
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              COLORS[
                                index %
                                  COLORS.length
                              ],
                          }}
                        />

                        <span
                          className="
                            block
                            truncate
                            text-[11px]
                            font-semibold
                            text-[#344361]
                          "
                        >
                          {tax.name}
                        </span>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="block text-[11px] font-bold text-[#25365f]">
                          {percentage}%
                        </span>

                        <span className="mt-0.5 block text-[9px] text-[#8a96b0]">
                          AOA{' '}
                          {formatCurrency(
                            tax.value
                          )}
                        </span>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* RODAPÉ */}

          <div
            className="
              mt-5
              flex
              items-center
              justify-between
              border-t
              border-[#edf0f5]
              pt-4
            "
          >
            <span className="text-[10px] text-[#8a96b0]">
              Impostos com valores registados
            </span>

            <span className="text-[11px] font-bold text-[#25365f]">
              {safeTaxes.length}
            </span>
          </div>
        </>
      )}
    </div>
  );
}