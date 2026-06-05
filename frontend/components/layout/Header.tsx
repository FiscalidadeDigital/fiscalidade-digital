'use client';

import {
  Bell,
  Search,
  Building2,
  BadgeCheck,
  CalendarDays,
} from 'lucide-react';

export default function Header({
  company,
}: any) {
  const today = new Date().toLocaleDateString(
    'pt-PT',
    {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }
  );

  return (
    <header
      className="
      bg-white
      border-b
      px-8
      py-5
      shadow-sm
      flex
      items-center
      justify-between
      gap-6
    "
    >
      {/* Empresa */}
      <div className="flex items-center gap-4">
        <div
          className="
          w-14
          h-14
          rounded-2xl
          bg-blue-600
          text-white
          flex
          items-center
          justify-center
          font-bold
          text-xl
          shadow-lg
        "
        >
          {company?.name?.[0] || 'E'}
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {company?.name || 'Empresa'}
          </h2>

          <div className="flex flex-wrap gap-4 mt-1 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Building2 size={14} />
              {company?.sector || 'Sector não definido'}
            </span>

            <span>
              NIF:
              <strong className="ml-1 text-slate-700">
                {company?.nif || '---'}
              </strong>
            </span>

            <span>
              Regime:
              <strong className="ml-1 text-blue-600">
                {company?.regime || 'Geral'}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Centro */}
      <div className="hidden lg:flex flex-1 justify-center px-10">
        <div
          className="
          flex
          items-center
          gap-3
          bg-slate-100
          rounded-2xl
          px-5
          py-3
          w-full
          max-w-lg
        "
        >
          <Search size={18} className="text-slate-400" />

          <input
            type="text"
            placeholder="Pesquisar clientes, facturas, impostos..."
            className="
              bg-transparent
              outline-none
              w-full
              text-sm
            "
          />
        </div>
      </div>

      {/* Direita */}
      <div className="flex items-center gap-4">
        <div
          className="
          hidden
          xl:flex
          items-center
          gap-2
          bg-green-50
          text-green-700
          px-4
          py-2
          rounded-xl
          border
          border-green-200
        "
        >
          <BadgeCheck size={18} />

          <span className="font-medium">
            Fiscal OK
          </span>
        </div>

        <div
          className="
          hidden
          lg:flex
          items-center
          gap-2
          text-slate-500
          text-sm
        "
        >
          <CalendarDays size={16} />

          {today}
        </div>

        <button
          className="
          relative
          p-3
          rounded-xl
          hover:bg-slate-100
          transition
        "
        >
          <Bell size={20} />

          <span
            className="
            absolute
            top-2
            right-2
            w-2
            h-2
            rounded-full
            bg-red-500
            "
          />
        </button>

        <div
          className="
          w-12
          h-12
          rounded-2xl
          bg-blue-600
          text-white
          font-bold
          flex
          items-center
          justify-center
          shadow-lg
        "
        >
          {company?.name?.[0] || 'E'}
        </div>
      </div>
    </header>
  );
}