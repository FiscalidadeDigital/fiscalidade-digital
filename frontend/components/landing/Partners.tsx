'use client';

/**
 * Kept for compatibility with previous landing imports. It deliberately makes
 * no commercial association or endorsement claim.
 */
export default function Partners() {
  return (
    <section className="border-y border-slate-200 bg-white py-16">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-800">Fundamentos da plataforma</p>
        <div className="mt-6 grid gap-5 border-l border-t border-slate-200 sm:grid-cols-3">
          {['Dados separados por empresa', 'Documentos privados', 'Acesso autenticado'].map((item) => <p key={item} className="border-b border-r border-slate-200 p-5 text-sm font-semibold text-slate-800">{item}</p>)}
        </div>
      </div>
    </section>
  );
}
