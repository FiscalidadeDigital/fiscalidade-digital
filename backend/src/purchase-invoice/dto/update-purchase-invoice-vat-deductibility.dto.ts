import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const PURCHASE_VAT_DEDUCTIBILITY_STATUSES = [
  'PENDING_REVIEW',
  'POTENTIALLY_ELIGIBLE',
  'DEDUCTIBLE',
  'NON_DEDUCTIBLE',
] as const;

export type PurchaseVatDeductibilityStatus =
  (typeof PURCHASE_VAT_DEDUCTIBILITY_STATUSES)[number];

export class UpdatePurchaseInvoiceVatDeductibilityDto {
  @IsIn(PURCHASE_VAT_DEDUCTIBILITY_STATUSES)
  status!: PurchaseVatDeductibilityStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
