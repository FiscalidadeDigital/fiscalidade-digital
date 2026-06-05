type Props = {
  total: number;
  pending: number;
  paid: number;
  late: number;
};

export default function DashboardCards({
  total,
  pending,
  paid,
  late,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <div className="bg-white rounded-2xl p-6 shadow">
        <p className="text-slate-500">
          Total de Obrigações
        </p>

        <h2 className="text-4xl font-bold mt-3">
          {total}
        </h2>
      </div>

      <div className="bg-yellow-50 rounded-2xl p-6 shadow">
        <p className="text-yellow-700">
          Pendentes
        </p>

        <h2 className="text-4xl font-bold mt-3">
          {pending}
        </h2>
      </div>

      <div className="bg-green-50 rounded-2xl p-6 shadow">
        <p className="text-green-700">
          Pagas
        </p>

        <h2 className="text-4xl font-bold mt-3">
          {paid}
        </h2>
      </div>

      <div className="bg-red-50 rounded-2xl p-6 shadow">
        <p className="text-red-700">
          Em Atraso
        </p>

        <h2 className="text-4xl font-bold mt-3">
          {late}
        </h2>
      </div>
    </div>
  );
}