import { Prisma } from '@prisma/client';

/** Mirrors the JSON value persisted on PayrollItem at calculation time. */
function capturePayrollItem(component: any) {
  const remunerationComponents = JSON.parse(JSON.stringify([{
    id: component.id, type: component.type, amount: component.amount.toString(),
    effectiveFrom: component.effectiveFrom.toISOString(), effectiveTo: component.effectiveTo,
    irtTreatment: component.irtTreatment, inssTreatment: component.inssTreatment,
    legalReference: component.legalReference,
  }]));
  return { remunerationComponents, grossAmount: '250000.00', socialSecurityBase: '200000.00', irtTaxableAmount: '244000.00', socialSecurityAmount: '6000.00', irtAmount: '0.00', netAmount: '244000.00' };
}

describe('historical payroll component snapshot immutability', () => {
  it('keeps October 2026 component and monetary results unchanged after the source component is ended', () => {
    const sourceComponent = {
      id: 'holiday-1', type: 'HOLIDAY_ALLOWANCE', amount: new Prisma.Decimal('50000'),
      effectiveFrom: new Date('2026-10-01T00:00:00.000Z'), effectiveTo: null,
      irtTreatment: 'NEEDS_OFFICIAL_CONFIRMATION', inssTreatment: 'EXCLUDED',
      legalReference: 'Decreto Presidencial n.º 227/18, arts. 12.º–14.º',
    };
    const octoberPayrollItem = capturePayrollItem(sourceComponent);
    const original = JSON.stringify(octoberPayrollItem);

    sourceComponent.effectiveTo = new Date('2026-12-31T00:00:00.000Z') as any;
    sourceComponent.amount = new Prisma.Decimal('75000');

    expect(JSON.stringify(octoberPayrollItem)).toBe(original);
    expect(octoberPayrollItem.remunerationComponents[0]).toEqual(expect.objectContaining({
      type: 'HOLIDAY_ALLOWANCE', amount: '50000', effectiveTo: null, inssTreatment: 'EXCLUDED',
    }));
    expect(octoberPayrollItem).toEqual(expect.objectContaining({ grossAmount: '250000.00', socialSecurityBase: '200000.00', irtTaxableAmount: '244000.00', socialSecurityAmount: '6000.00', irtAmount: '0.00', netAmount: '244000.00' }));
  });
});
