"use client";

import { useEffect, useState } from "react";
import revenueService from "@/services/revenue";

export default function RevenuePage() {
  const [revenues, setRevenues] = useState<any[]>([]);

  async function loadData() {
    try {
      const data = await revenueService.findAll();
      setRevenues(data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-6">
        Receitas da Empresa
      </h1>

      <div className="bg-white rounded-xl shadow p-6">
        <table className="w-full">
          <thead>
            <tr>
              <th>Mês</th>
              <th>Ano</th>
              <th>Valor</th>
              <th>Observação</th>
            </tr>
          </thead>

          <tbody>
            {revenues.map((item) => (
              <tr key={item.id}>
                <td>{item.month}</td>
                <td>{item.year}</td>
                <td>
                  {Number(item.amount).toLocaleString("pt-PT")} AKZ
                </td>
                <td>{item.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}