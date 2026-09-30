import { Type } from 'class-transformer';
import {
  IsNumber,
  IsNotEmpty,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class PurchaseInvoiceItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  productName!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  quantity!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice!: number;
}
