import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateInvoiceDto {
  @IsString()
  tenantId: string;

  @IsString()
  clientId: string;

  @IsNumber()
  subtotal: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
  }[];
}