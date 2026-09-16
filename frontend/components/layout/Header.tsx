'use client';

import {
  Search,
  HelpCircle,
  Bell,
} from 'lucide-react';

export default function Header() {
  return (
    <header
      className="
        h-[88px]
        bg-white
        border-b
        border-slate-200
        flex
        items-center
        justify-between
        px-6
        lg:px-8
        sticky
        top-0
        z-40
      "
    >

      {/* PESQUISA */}
      <div className="relative w-full max-w-[560px]">

        <Search
          size={21}
          className="
            absolute
            left-5
            top-1/2
            -translate-y-1/2
            text-slate-400
          "
        />

        <input
          type="text"
          placeholder="Pesquisar..."
          className="
            w-full
            h-12
            rounded-2xl
            border
            border-slate-200
            bg-slate-50
            pl-14
            pr-16
            outline-none
            text-slate-700
            placeholder:text-slate-400
            focus:border-blue-500
            focus:ring-4
            focus:ring-blue-500/10
            transition
          "
        />

        <div
          className="
            absolute
            right-4
            top-1/2
            -translate-y-1/2
            px-2
            py-1
            rounded-lg
            border
            border-slate-200
            bg-white
            text-xs
            text-slate-400
          "
        >
          ⌘K
        </div>

      </div>

      {/* DIREITA */}
      <div className="flex items-center gap-5 ml-6">

        <button
          className="
            w-10
            h-10
            rounded-xl
            flex
            items-center
            justify-center
            text-slate-600
            hover:bg-slate-100
            transition
          "
        >
          <HelpCircle size={21} />
        </button>

        <button
          className="
            relative
            w-10
            h-10
            rounded-xl
            flex
            items-center
            justify-center
            text-slate-600
            hover:bg-slate-100
            transition
          "
        >

          <Bell size={21} />

          <span
            className="
              absolute
              -top-1
              -right-1
              w-5
              h-5
              rounded-full
              bg-red-500
              text-white
              text-[10px]
              font-bold
              flex
              items-center
              justify-center
            "
          >
            4
          </span>

        </button>

        <div className="h-8 w-px bg-slate-200" />

        <div className="flex items-center gap-3">

          <div className="text-right hidden sm:block">

            <p className="text-sm font-bold text-slate-900">
              Edgar&Filhos
            </p>

            <p className="text-xs text-slate-400">
              NIF: 5000123
            </p>

          </div>

          <div
            className="
              w-11
              h-11
              rounded-full
              bg-indigo-600
              text-white
              font-bold
              flex
              items-center
              justify-center
            "
          >
            E
          </div>

        </div>

      </div>

    </header>
  );
}