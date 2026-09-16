import api from './api';

export type PayrollStatus =
  | 'DRAFT'
  | 'CALCULATED'
  | 'APPROVED'
  | 'PAID'
  | 'CLOSED'
  | string;

export type PayrollItem = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNif?: string | null;
  socialSecurityNumber?: string | null;

  dependentCount?: number | null;

  baseSalary?: number | string | null;
  foodAllowance?: number | string | null;
  transportAllowance?: number | string | null;
  otherAllowances?: number | string | null;

  bonuses?: number | string | null;
  commissions?: number | string | null;
  otherIncome?: number | string | null;

  grossAmount?: number | string | null;

  socialSecurityBase?: number | string | null;
  socialSecurityAmount?: number | string | null;

  irtTaxableAmount?: number | string | null;
  irtAmount?: number | string | null;

  otherDeductions?: number | string | null;

  netAmount?: number | string | null;
};

export type Payroll = {
  id: string;
  period: string;
  month: number;
  year: number;

  status: PayrollStatus;

  employeeCount: number;

  grossAmount?: number | string | null;
  socialSecurityAmount?: number | string | null;
  irtAmount?: number | string | null;
  otherDeductionsAmount?: number | string | null;
  netAmount?: number | string | null;

  processedAt?: string | null;

  items?: PayrollItem[];
};

export type CreatePayrollData = {
  month: number;
  year: number;
};

function extractPayroll(
  value: unknown,
): Payroll | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  return value as Payroll;
}

function extractPayrollList(
  value: unknown,
): Payroll[] {
  if (Array.isArray(value)) {
    return value as Payroll[];
  }

  if (
    value &&
    typeof value === 'object' &&
    'data' in value &&
    Array.isArray(
      (value as { data?: unknown }).data,
    )
  ) {
    return (value as { data: Payroll[] }).data;
  }

  return [];
}

export async function getPayrolls(): Promise<Payroll[]> {
  const response = await api.get('/payroll');

  return extractPayrollList(response.data);
}

export async function getPayrollByPeriod(
  year: number,
  month: number,
): Promise<Payroll | null> {
  try {
    const response = await api.get(
      `/payroll/${year}/${month}`,
    );

    return extractPayroll(response.data);
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function createPayroll(
  data: CreatePayrollData,
): Promise<Payroll> {
  const response = await api.post(
    '/payroll',
    {
      month: Number(data.month),
      year: Number(data.year),
    },
  );

  const payroll = extractPayroll(
    response.data,
  );

  if (!payroll) {
    throw new Error(
      'A API não devolveu a folha criada.',
    );
  }

  return payroll;
}

export async function calculatePayroll(
  id: string,
): Promise<Payroll> {
  const response = await api.post(
    `/payroll/${id}/calculate`,
  );

  const payroll = extractPayroll(
    response.data,
  );

  if (!payroll) {
    throw new Error(
      'A API não devolveu a folha calculada.',
    );
  }

  return payroll;
}

export async function approvePayroll(
  id: string,
): Promise<Payroll> {
  const response = await api.post(
    `/payroll/${id}/approve`,
  );

  const payroll = extractPayroll(
    response.data,
  );

  if (!payroll) {
    throw new Error(
      'A API não devolveu a folha aprovada.',
    );
  }

  return payroll;
}

export async function payPayroll(
  id: string,
): Promise<Payroll> {
  const response = await api.post(
    `/payroll/${id}/pay`,
  );

  const payroll = extractPayroll(
    response.data,
  );

  if (!payroll) {
    throw new Error(
      'A API não devolveu a folha paga.',
    );
  }

  return payroll;
}