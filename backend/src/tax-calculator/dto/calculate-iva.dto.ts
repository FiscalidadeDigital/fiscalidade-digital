import {
  IsEnum,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum IvaOperation {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  SERVICE = 'SERVICE',
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT',
}

export class CalculateIvaDto {
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsEnum(IvaOperation)
  operation!: IvaOperation;

  /** Fiscal date used to resolve the IVA enrollment and rule version. */
  @IsOptional()
  @IsDateString()
  referenceDate?: string;

  @IsOptional()
  @IsString()
  productType?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
