'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import {
  Receipt,
  Landmark,
  ShieldCheck,
  Wallet,
} from 'lucide-react';

interface TaxData {
  name: string;
  value: number;
  percentage: number;
}

interface Props {
  data: TaxData[];
}

const icons = [
  Receipt,
  Landmark,
  ShieldCheck,
  Wallet,
];

const chartColors = [
  '#4f46e5',
  '#3b82f6',
  '#f59e0b',
  '#10b981',
  '#94a3b8',
];

function formatAOA(value: number) {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PieChartFiscal({
  data,
}: Props) {
  const total = data.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  return (
    <div className="
      rounded-2xl
      border
      border-slate-200
      bg-white
      p-6
      shadow-sm
    ">

      <div className="mb-5">

        <h3 className="font-bold text-slate-900">
          Resumo de Impostos
        </h3>

        <p className="mt-1 text-xs text-slate-500">
          Distribuição fiscal da empresa
        </p>

      </div>

      {data.length === 0 ? (
        <div className="
          flex
          h-[300px]
          items-center
          justify-center
          rounded-xl
          bg-slate-50
        ">
          <p className="text-sm text-slate-500">
            Ainda não existem dados fiscais.
          </p>
        </div>
      ) : (
        <div className="
          grid
          grid-cols-1
          gap-5
          lg:grid-cols-2
        ">

          <div className="relative h-[300px]">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>

                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={75}
                  outerRadius={110}
                  paddingAngle={3}
                >
                  {data.map(
                    (_, index) => (
                      <Cell
                        key={index}
                        fill={
                          chartColors[
                            index %
                              chartColors.length
                          ]
                        }
                      />
                    ),
                  )}
                </Pie>

                <Tooltip
                  formatter={(value: any) =>
                    formatAOA(
                      Number(value),
                    )
                  }
                />

              </PieChart>
            </ResponsiveContainer>

            <div className="
              pointer-events-none
              absolute
              inset-0
              flex
              flex-col
              items-center
              justify-center
            ">

              <span className="text-xs text-slate-500">
                Total Pago
              </span>

              <strong className="mt-1 text-xl text-slate-900">
                {formatAOA(total)}
              </strong>

            </div>

          </div>

          <div className="space-y-3">

            {data.map((item, index) => {

              const Icon =
                icons[
                  index % icons.length
                ];

              return (
                <div
                  key={`${item.name}-${index}`}
                  className="
                    flex
                    items-center
                    justify-between
                    rounded-xl
                    border
                    border-slate-100
                    p-3
                  "
                >

                  <div className="flex items-center gap-3">

                    <div className="
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-lg
                      bg-indigo-50
                    ">
                      <Icon
                        size={17}
                        className="text-indigo-600"
                      />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        {item.name}
                      </p>

                      <p className="text-[11px] text-slate-500">
                        {item.percentage}%
                      </p>
                    </div>

                  </div>

                  <strong className="text-xs text-slate-800">
                    {formatAOA(item.value)}
                  </strong>

                </div>
              );
            })}

          </div>

        </div>
      )}

    </div>
  );
}