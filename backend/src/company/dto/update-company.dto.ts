import {
  IsOptional,
  IsString,
  IsNumber,
} from 'class-validator';

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsNumber()
  employees?: number;

  @IsOptional()
  @IsString()
  logo?: string;
}