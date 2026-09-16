import api from './api';

export type IVAResult = {
  imposto: string;
  regime: string;
  base: number;
  taxa: number;
  iva: number;
  total: number;
  mensagem?: string;
};

export type RetentionResult = {
  imposto: string;
  regime: string;
  base: number;
  taxa: number;
  retencao: number;
  liquido: number;
  mensagem?: string;
};

export type IndustrialResult = {
  impostoTipo: string;
  regime: string;
  sector?: string;
  receitas: number;
  custos: number;
  lucro: number;
  materiaColectavel: number;
  taxa: number;
  imposto: number;
  descricao?: string;
};

// =====================================================
// IVA
// =====================================================

export async function calculateIVA(
  base: number,
): Promise<IVAResult> {
  const response = await api.post(
    '/tax-calculator/iva',
    {
      base,
    },
  );

  return response.data;
}

// =====================================================
// RETENÇÃO
// =====================================================

export async function calculateRetention(
  valor: number,
): Promise<RetentionResult> {
  const response = await api.post(
    '/tax-calculator/retention',
    {
      valor,
    },
  );

  return response.data;
}

// =====================================================
// IMPOSTO INDUSTRIAL
// =====================================================

export async function calculateIndustrial(
  receitas: number,
  custos: number,
): Promise<IndustrialResult> {
  const response = await api.post(
    '/tax-calculator/industrial',
    {
      receitas,
      custos,
    },
  );

  return response.data;
}

// =====================================================
// HISTÓRICO
// =====================================================

export async function getCalculationHistory() {
  return [];
}