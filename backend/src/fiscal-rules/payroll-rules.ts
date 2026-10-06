import { Prisma, SocialSecurityCategory } from '@prisma/client';

export const IRT_2026_LEGAL_SOURCE = {
  title: 'Lei n.º 14/25, de 30 de Dezembro — OGE 2026',
  officialUrl:
    'https://www.ucm.minfin.gov.ao/cs/groups/public/documents/document/aw41/mje2/~edisp/minfin5216784.pdf',
  article: 'Artigo 21.º, n.º 3, e Anexo I',
  publishedAt: '2025-12-30',
  effectiveFrom: '2026-01-01',
  // A Lei não contém cláusula de caducidade em 31/12/2026. A regra mantém-se
  // aplicável até que uma norma posterior, registada neste módulo, a substitua.
  effectiveTo: null,
  consultedAt: '2026-09-30',
} as const;

export const INSS_LEGAL_SOURCE = {
  title:
    'Decreto Presidencial n.º 227/18, de 27 de Setembro',
  officialUrl:
    'https://portal.inss.gov.ao/wp-content/uploads/2021/10/227_18.pdf',
  articles: ['Artigo 12.º', 'Artigo 13.º'],
  publishedAt: '2018-09-27',
  consultedAt: '2026-09-30',
} as const;

export const IRT_ALLOWANCE_SOURCE = {
  title: 'Portal do Contribuinte — Imposto sobre os Rendimentos do Trabalho',
  officialUrl:
    'https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-rendimentos-do-trabalho',
  consultedAt: '2026-09-30',
} as const;

export const PAYROLL_RULE_VERSION_2026 =
  'AO-PAYROLL-2026-OGE14-25-INSS227-18';

export const PAYROLL_CALCULATION_STATUS =
  'GROUP_A_FULL_MONTH_STANDARD_COMPONENTS';

export const IRT_ALLOWANCE_EXEMPT_LIMITS = {
  food: new Prisma.Decimal('30000'),
  transport: new Prisma.Decimal('30000'),
} as const;

export type IrtBracket = {
  upperBound: Prisma.Decimal | null;
  fixedAmount: Prisma.Decimal;
  rate: Prisma.Decimal;
  excessOver: Prisma.Decimal;
};

export const IRT_GROUP_A_2026_BRACKETS: readonly IrtBracket[] = [
  {
    upperBound: new Prisma.Decimal('150000'),
    fixedAmount: new Prisma.Decimal('0'),
    rate: new Prisma.Decimal('0'),
    excessOver: new Prisma.Decimal('0'),
  },
  {
    upperBound: new Prisma.Decimal('200000'),
    fixedAmount: new Prisma.Decimal('12500'),
    rate: new Prisma.Decimal('0.16'),
    excessOver: new Prisma.Decimal('150000'),
  },
  {
    upperBound: new Prisma.Decimal('300000'),
    fixedAmount: new Prisma.Decimal('31250'),
    rate: new Prisma.Decimal('0.18'),
    excessOver: new Prisma.Decimal('200000'),
  },
  {
    upperBound: new Prisma.Decimal('500000'),
    fixedAmount: new Prisma.Decimal('49250'),
    rate: new Prisma.Decimal('0.19'),
    excessOver: new Prisma.Decimal('300000'),
  },
  {
    upperBound: new Prisma.Decimal('1000000'),
    fixedAmount: new Prisma.Decimal('87250'),
    rate: new Prisma.Decimal('0.20'),
    excessOver: new Prisma.Decimal('500000'),
  },
  {
    upperBound: new Prisma.Decimal('1500000'),
    fixedAmount: new Prisma.Decimal('187250'),
    rate: new Prisma.Decimal('0.21'),
    excessOver: new Prisma.Decimal('1000000'),
  },
  {
    upperBound: new Prisma.Decimal('2000000'),
    fixedAmount: new Prisma.Decimal('292250'),
    rate: new Prisma.Decimal('0.22'),
    excessOver: new Prisma.Decimal('1500000'),
  },
  {
    upperBound: new Prisma.Decimal('2500000'),
    fixedAmount: new Prisma.Decimal('402250'),
    rate: new Prisma.Decimal('0.23'),
    excessOver: new Prisma.Decimal('2000000'),
  },
  {
    upperBound: new Prisma.Decimal('5000000'),
    fixedAmount: new Prisma.Decimal('517250'),
    rate: new Prisma.Decimal('0.24'),
    excessOver: new Prisma.Decimal('2500000'),
  },
  {
    upperBound: new Prisma.Decimal('10000000'),
    fixedAmount: new Prisma.Decimal('1117250'),
    rate: new Prisma.Decimal('0.245'),
    excessOver: new Prisma.Decimal('5000000'),
  },
  {
    upperBound: null,
    fixedAmount: new Prisma.Decimal('2342250'),
    rate: new Prisma.Decimal('0.25'),
    excessOver: new Prisma.Decimal('10000000'),
  },
] as const;

export type SocialSecurityRates = {
  employee: Prisma.Decimal;
  employer: Prisma.Decimal;
};

export function resolveSocialSecurityRates(
  category: SocialSecurityCategory,
): SocialSecurityRates {
  if (category === SocialSecurityCategory.STANDARD) {
    return {
      employee: new Prisma.Decimal('0.03'),
      employer: new Prisma.Decimal('0.08'),
    };
  }

  if (category === SocialSecurityCategory.RETIRED) {
    return {
      employee: new Prisma.Decimal('0.08'),
      employer: new Prisma.Decimal('0.08'),
    };
  }

  throw new Error(
    'O regime especial de Segurança Social requer uma taxa legal configurada.',
  );
}

export type PayrollRuleSet = {
  version: string;
  validFrom: string;
  validTo: string | null;
};

const PAYROLL_RULE_SETS: readonly PayrollRuleSet[] = [
  {
    version: PAYROLL_RULE_VERSION_2026,
    validFrom: '2026-01-01',
    validTo: null,
  },
] as const;

/** Resolve pela data do período e não pelo número do ano. */
export function resolvePayrollRuleSet(year: number): PayrollRuleSet {
  const period = `${year}-01-01`;
  const rule = PAYROLL_RULE_SETS.find(
    (candidate) =>
      candidate.validFrom <= period &&
      (candidate.validTo === null || candidate.validTo >= period),
  );

  if (!rule) {
    throw new Error(`Não existe uma versão fiscal validada para calcular folhas de ${year}.`);
  }

  return rule;
}

export function assertSupportedPayrollYear(year: number): void {
  resolvePayrollRuleSet(year);
}
