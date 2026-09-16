import {
  IsNumber,
  Min,
} from 'class-validator';

export class CalculateIndustrialDto {
  @IsNumber()
  @Min(0)
  receitas!: number;

  @IsNumber()
  @Min(0)
  custos!: number;
}