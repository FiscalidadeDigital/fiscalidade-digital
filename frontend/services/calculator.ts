import api from './api';

export async function calculateIVA(
  base: number,
  taxa = 14,
) {
  const response = await api.post(
    '/tax-calculator/iva',
    {
      base,
      taxa,
    },
  );

  return response.data;
}

export async function calculateRetention(
  valor: number,
  taxa = 6.5,
) {
  const response = await api.post(
    '/tax-calculator/retention',
    {
      valor,
      taxa,
    },
  );

  return response.data;
}

export async function calculateIndustrial(
  receitas: number,
  custos: number,
) {
  const response = await api.post(
    '/tax-calculator/industrial',
    {
      receitas,
      custos,
    },
  );

  return response.data;
}

export async function getCalculationHistory() {
  return [];
}