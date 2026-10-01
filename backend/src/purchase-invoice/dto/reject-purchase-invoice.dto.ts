import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectPurchaseInvoiceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason!: string;
}
