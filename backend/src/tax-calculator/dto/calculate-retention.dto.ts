import {
  IsNumber,
  Min,
} from 'class-validator';

export class CalculateRetentionDto {
  @IsNumber()
  @Min(0)
  amount!: number;
}