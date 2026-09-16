import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

import { TaxType } from '@prisma/client';

export class CreatePaymentDto {
  @IsEnum(TaxType)
  taxType: TaxType;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsUUID()
  declarationId?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsDateString()
  paidAt?: string;
}