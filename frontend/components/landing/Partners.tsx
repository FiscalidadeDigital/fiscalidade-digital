'use client';

export default function Partners() {
  const companies = [
    'SONANGOL',
    'UNITEL',
    'BAI',
    'ENSA',
    'BFA',
    'ANGOLA CABLES',
    'TAAG',
    'BIC',
    'STANDARD BANK',
    'EMIS',
  ];

  const items = [
    ...companies,
    ...companies,
  ];

  return (
    <section className="py-28 bg-white overflow-hidden">

      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-16">

          <h2 className="text-5xl font-black text-slate-900">
            Empresas e Parceiros
          </h2>

          <p className="text-slate-600 text-xl mt-4">
            Preparado para empresas de qualquer dimensão.
          </p>

        </div>

      </div>

      <div className="relative">

        {/* Fade esquerdo */}

        <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-white to-transparent z-10" />

        {/* Fade direito */}

        <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-white to-transparent z-10" />

        {/* Slider */}

        <div className="flex animate-[marquee_30s_linear_infinite] w-max">

          {items.map(
            (
              company,
              index,
            ) => (
              <div
                key={index}
                className="
                  mx-4
                  min-w-[220px]
                  h-28
                  rounded-3xl
                  border
                  border-slate-200
                  bg-slate-50
                  flex
                  items-center
                  justify-center
                  font-bold
                  text-slate-600
                  text-lg
                  hover:shadow-xl
                  transition
                "
              >
                {company}
              </div>
            ),
          )}

        </div>

      </div>

    </section>
  );
}