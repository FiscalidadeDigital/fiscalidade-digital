import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PurchaseInvoiceItemDto } from './purchase-invoice-item.dto';

export class CreatePurchaseInvoiceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  supplierId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  invoiceNumber!: string;

  @IsDateString()
  issuedAt!: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  iva!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  withholdingTax!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseInvoiceItemDto)
  items!: PurchaseInvoiceItemDto[];
}
