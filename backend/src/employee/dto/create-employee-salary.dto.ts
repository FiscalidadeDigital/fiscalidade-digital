import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateEmployeeSalaryDto {
  @IsNumber()
  @Min(0)
  baseSalary: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  foodAllowance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  transportAllowance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  otherAllowances?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bonuses?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  commissions?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  otherIncome?: number;

  @IsDateString()
  effectiveFrom: string;

  @IsOptional()
  @IsString()
  notes?: string;
}