import {
  calculateSocialSecurityTotal,
  calculateVatAssessment,
  industrialAssessmentRequiresReview,
} from './fiscal-assessment';

describe('fiscal assessment safeguards', () => {
  it('does not deduct indicated or pending input IVA', () => {
    const assessment = calculateVatAssessment('140.01', [
      { amount: '42.00', status: 'PENDING_REVIEW' },
      { amount: '10.00', status: 'POTENTIALLY_ELIGIBLE' },
    ]);

    expect(assessment.inputVatIndicated).toBe('52.00');
    expect(assessment.inputVatDeductibleConfirmed).toBe('0.00');
    expect(assessment.payable).toBe('140.01');
    expect(assessment.calculationStatus).toBe('REVIEW_REQUIRED');
  });

  it('uses only human-confirmed input IVA and carries a credit deterministically', () => {
    const assessment = calculateVatAssessment('100.00', [
      { amount: '40.005', status: 'DEDUCTIBLE_CONFIRMED' },
      { amount: '80.00', status: 'DEDUCTIBLE_CONFIRMED' },
    ]);

    expect(assessment.inputVatDeductibleConfirmed).toBe('120.01');
    expect(assessment.payable).toBe('0.00');
    expect(assessment.creditGenerated).toBe('20.01');
    expect(assessment.calculationStatus).toBe('CREDIT');
  });

  it('keeps worker and employer social-security contributions distinct', () => {
    expect(
      calculateSocialSecurityTotal([
        { employee: '3.00', employer: '8.00' },
        { employee: '1.50', employer: '4.00' },
      ]),
    ).toEqual({ employee: '4.50', employer: '12.00', total: '16.50' });
  });

  it('does not call a revenue-only industrial result definitive', () => {
    expect(industrialAssessmentRequiresReview()).toMatchObject({
      calculationStatus: 'REVIEW_REQUIRED',
      finalAmount: '0.00',
    });
  });
});
