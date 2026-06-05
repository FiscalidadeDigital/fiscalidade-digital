interface Props {
  result: any;
}

export default function TaxResultCard({
  result,
}: Props) {
  if (!result) return null;

  return (
    <div className="bg-white mt-8 p-6 rounded-xl shadow border">

      <h2 className="text-2xl font-bold mb-6">
        Resultado do Cálculo
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-slate-50 border rounded-xl p-5">
          <p className="text-slate-500">
            Valor Base
          </p>

          <h3 className="text-2xl font-bold mt-2">
            {Number(
              result.amount,
            ).toLocaleString()} AKZ
          </h3>
        </div>

        <div className="bg-red-50 border rounded-xl p-5">
          <p className="text-red-600">
            Imposto
          </p>

          <h3 className="text-2xl font-bold mt-2 text-red-700">
            {Number(
              result.tax,
            ).toLocaleString()} AKZ
          </h3>
        </div>

        <div className="bg-blue-50 border rounded-xl p-5">
          <p className="text-blue-600">
            Taxa Aplicada
          </p>

          <h3 className="text-2xl font-bold mt-2 text-blue-700">
            {result.rate}
          </h3>
        </div>

        <div className="bg-green-50 border rounded-xl p-5">
          <p className="text-green-600">
            Total
          </p>

          <h3 className="text-2xl font-bold mt-2 text-green-700">
            {Number(
              result.total,
            ).toLocaleString()} AKZ
          </h3>
        </div>

      </div>
    </div>
  );
}