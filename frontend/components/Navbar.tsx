'use client';

import { useRouter } from 'next/navigation';
import { removeToken } from '../lib/auth';
import { LogOut } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();

  function logout() {
    removeToken();
    router.push('/login');
  }

  return (
    <header className="bg-white border-b border-slate-200 h-20 px-8 flex items-center justify-between">

      <div>
        <h2 className="font-bold text-xl text-slate-800">
          Fiscalidade Digital
        </h2>

        <p className="text-slate-500 text-sm">
          Sistema Inteligente de Gestão Fiscal
        </p>
      </div>

      <div className="flex items-center gap-4">

        <div className="text-right">
          <h3 className="font-semibold">
            Administrador
          </h3>

          <p className="text-sm text-slate-500">
            Empresa
          </p>
        </div>

        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
          A
        </div>

        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <LogOut size={16} />
          Sair
        </button>

      </div>
    </header>
  );
}