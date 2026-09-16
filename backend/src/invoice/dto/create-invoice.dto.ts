import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

export class CreateInvoiceItemDto {
  @IsString()
  productName: string;

  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @IsNumber()
  @Min(0.01)
  unitPrice: number;
}

export class CreateInvoiceDto {
  @IsUUID()
  clientId: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}