import {
  IsDateString,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';

export class CalculateIndustrialDto {
  @IsNumber()
  @Min(0)
  receitas!: number;

  @IsNumber()
  @Min(0)
  custos!: number;

  /** Fiscal date used to resolve the Industrial enrollment and rule version. */
  @IsOptional()
  @IsDateString()
  referenceDate?: string;
}
