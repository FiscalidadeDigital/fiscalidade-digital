import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
} from 'class-validator';

export class CreateObligationDto {
  @IsString()
  title!: string;

  @IsString()
  type!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsDateString()
  dueDate!: string;
}