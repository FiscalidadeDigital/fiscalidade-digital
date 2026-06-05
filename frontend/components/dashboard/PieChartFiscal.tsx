'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import {
  Landmark,
  Receipt,
  ShieldCheck,
  Wallet,
} from 'lucide-react';

const data = [
  {
    name: 'IVA',
    valor: 1400000,
    color: '#2563eb',
    icon: Receipt,
  },
  {
    name: 'IRT',
    valor: 450000,
    color: '#16a34a',
    icon: Landmark,
  },
  {
    name: 'Industrial',
    valor: 300000,
    color: '#ea580c',
    icon: ShieldCheck,
  },
  {
    name: 'Segurança Social',
    valor: 130000,
    color: '#dc2626',
    icon: Wallet,
  },
];

const totalFiscal = data.reduce(
  (acc, item) => acc + item.valor,
  0,
);

export default function PieChartFiscal() {
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">

        <div>
          <h3 className="text-xl font-bold text-slate-800">
            Distribuição Fiscal
          </h3>

          <p className="text-sm text-slate-500">
            Impostos e obrigações da empresa
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
            font-semibold
          "
        >
          Total Fiscal
        </div>

      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-center">

        {/* Gráfico */}
        <div className="relative h-[360px]">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <PieChart>
              <Pie
                data={data}
                dataKey="valor"
                nameKey="name"
                innerRadius={90}
                outerRadius={130}
                paddingAngle={3}
              >
                {data.map((item, index) => (
                  <Cell
                    key={index}
                    fill={item.color}
                  />
                ))}
              </Pie>

              <Tooltip
                formatter={(value: any) =>
                  `${Number(value).toLocaleString()} AOA`
                }
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Centro */}
          <div
            className="
              absolute
              inset-0
              flex
              flex-col
              items-center
              justify-center
              pointer-events-none
            "
          >
            <span className="text-slate-500 text-sm">
              Total Fiscal
            </span>

            <h2
              className="
                text-3xl
                font-bold
                text-slate-800
              "
            >
              {totalFiscal.toLocaleString()}
            </h2>

            <span className="text-xs text-slate-400">
              AOA
            </span>
          </div>

        </div>

        {/* Legenda Premium */}
        <div className="space-y-4">

          {data.map((item, index) => {
            const Icon = item.icon;

            const percentage =
              (
                (item.valor /
                  totalFiscal) *
                100
              ).toFixed(1);

            return (
              <div
                key={index}
                className="
                  border
                  border-slate-200
                  rounded-2xl
                  p-4
                  hover:shadow-lg
                  transition
                "
              >
                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-3">

                    <div
                      className="
                        w-12
                        h-12
                        rounded-xl
                        flex
                        items-center
                        justify-center
                      "
                      style={{
                        backgroundColor:
                          `${item.color}15`,
                      }}
                    >
                      <Icon
                        size={22}
                        color={item.color}
                      />
                    </div>

                    <div>

                      <h4 className="font-semibold text-slate-800">
                        {item.name}
                      </h4>

                      <p className="text-sm text-slate-500">
                        {percentage}% do total
                      </p>

                    </div>

                  </div>

                  <div className="text-right">

                    <div className="font-bold text-slate-800">
                      {item.valor.toLocaleString()}
                    </div>

                    <div className="text-xs text-slate-500">
                      AOA
                    </div>

                  </div>

                </div>
              </div>
            );
          })}

        </div>

      </div>

      {/* Footer */}
      <div
        className="
          mt-6
          pt-4
          border-t
          border-slate-200
          flex
          justify-between
          text-sm
        "
      >
        <span className="text-slate-500">
          Actualizado em tempo real
        </span>

        <span className="font-semibold text-green-600">
          Compliance Fiscal: 95%
        </span>
      </div>
    </div>
  );
}