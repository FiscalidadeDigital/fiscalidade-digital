import api from '@/services/api';

export enum IvaOperation {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  SERVICE = 'SERVICE',
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT',
}

export interface CalculateIvaPayload {
  amount: number;
  operation: IvaOperation;
  referenceDate?: string;
  productType?: string;
  description?: string;
}

export interface CalculateRetentionPayload {
  amount: number;
}

export interface CalculateIndustrialPayload {
  receitas: number;
  custos: number;
  referenceDate?: string;
}

// =====================================================
// IVA
// =====================================================

export async function calculateIVA(
  data: CalculateIvaPayload,
) {
  const response =
    await api.post(
      '/tax-calculator/iva',
      data,
    );

  return response.data;
}

// =====================================================
// RETENÇÃO
// =====================================================

export async function calculateRetention(
  amount: number,
) {
  const response =
    await api.post(
      '/tax-calculator/retention',
      {
        amount,
      },
    );

  return response.data;
}

// =====================================================
// INDUSTRIAL
// =====================================================

export async function calculateIndustrial(
  receitas: number,
  custos: number,
  referenceDate?: string,
) {
  const response =
    await api.post(
      '/tax-calculator/industrial',
      {
      receitas,
      custos,
      referenceDate,
      },
    );

  return response.data;
}
