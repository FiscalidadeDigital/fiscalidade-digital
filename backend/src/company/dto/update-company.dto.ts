import {
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { FiscalRegime } from '@prisma/client';

const COMPANY_TYPES = [
  'COMERCIANTE_NOME_INDIVIDUAL',
  'SOCIEDADE_UNIPESSOAL_QUOTAS',
  'SOCIEDADE_POR_QUOTAS',
  'SOCIEDADE_ANONIMA',
  'SOCIEDADE_EM_NOME_COLETIVO',
  'SOCIEDADE_EM_COMANDITA',
  'COOPERATIVA',
  'SUCURSAL',
  'ESCRITORIO_REPRESENTACAO',
  'OUTRO',
];

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  nif?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  sector?: string;

  @IsOptional()
  @IsIn(COMPANY_TYPES)
  companyType?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  employeeCount?: number;

  @IsOptional()
  @IsEnum(FiscalRegime)
  regime?: FiscalRegime;
}
