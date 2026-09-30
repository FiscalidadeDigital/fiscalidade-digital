import { Prisma } from '@prisma/client';

export type InvoiceCalculationInput = {
  quantity: number;
  unitPrice: number;
};

export type InvoiceCalculation = {
  lines: Array<{
    quantity: Prisma.Decimal;
    unitPrice: Prisma.Decimal;
    total: Prisma.Decimal;
  }>;
  subtotal: Prisma.Decimal;
  iva: Prisma.Decimal;
  withholdingTax: Prisma.Decimal;
  total: Prisma.Decimal;
};

const ZERO = new Prisma.Decimal(0);

export function calculateInvoiceAmounts(
  items: InvoiceCalculationInput[],
  ivaRate: number,
  retentionRate: number,
): InvoiceCalculation {
  const lines = items.map((item) => {
    const quantity = new Prisma.Decimal(String(item.quantity)).toDecimalPlaces(
      4,
      Prisma.Decimal.ROUND_HALF_UP,
    );
    const unitPrice = new Prisma.Decimal(String(item.unitPrice)).toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP,
    );
    const total = quantity
      .mul(unitPrice)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    return { quantity, unitPrice, total };
  });

  const subtotal = lines
    .reduce((sum, line) => sum.add(line.total), ZERO)
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  const iva = subtotal
    .mul(new Prisma.Decimal(String(ivaRate)))
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  const withholdingTax = subtotal
    .mul(new Prisma.Decimal(String(retentionRate)))
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  const total = subtotal
    .add(iva)
    .sub(withholdingTax)
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

  return { lines, subtotal, iva, withholdingTax, total };
}
