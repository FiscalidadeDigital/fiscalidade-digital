'use client';

import Calendar from 'react-calendar';

export default function CalendarFiscal() {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h3 className="font-bold mb-4">
        Calendário Fiscal
      </h3>

      <Calendar />

      <div className="mt-4 space-y-2">
        <div>15 Junho — IVA</div>
        <div>20 Junho — IRT</div>
        <div>25 Junho — Segurança Social</div>
      </div>
    </div>
  );
}