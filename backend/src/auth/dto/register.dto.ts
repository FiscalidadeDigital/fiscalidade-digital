import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsIn,
  Min,
  MinLength,
} from 'class-validator';

import { FiscalRegime } from '@prisma/client';

export class RegisterDto {
  @IsString({
    message: 'O nome da empresa deve ser um texto.',
  })
  @IsNotEmpty({
    message: 'O nome da empresa é obrigatório.',
  })
  companyName!: string;

  @IsString({
    message: 'O nome do responsável deve ser um texto.',
  })
  @IsNotEmpty({
    message: 'O nome do responsável é obrigatório.',
  })
  ownerName!: string;

  @IsString({
    message: 'O NIF deve ser um texto.',
  })
  @IsNotEmpty({
    message: 'O NIF é obrigatório.',
  })
  nif!: string;

  @IsEmail(
    {},
    {
      message: 'Introduza um email válido.',
    },
  )
  email!: string;

  @IsOptional()
  @IsString({
    message: 'O telefone deve ser um texto.',
  })
  phone?: string;

  @IsOptional()
  @IsString({
    message: 'A morada deve ser um texto.',
  })
  address?: string;

  @IsOptional()
  @IsString({
    message: 'O sector deve ser um texto.',
  })
  sector?: string;

  @IsString({
    message: 'O tipo de empresa deve ser um texto.',
  })
  @IsNotEmpty({
    message: 'O tipo de empresa é obrigatório.',
  })
  @IsIn(
    [
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
    ],
    {
      message: 'Seleccione um tipo de empresa válido.',
    },
  )
  companyType!: string;

  @IsOptional()
  @IsInt({
    message:
      'O número de funcionários deve ser um número inteiro.',
  })
  @Min(0, {
    message:
      'O número de funcionários não pode ser negativo.',
  })
  employees?: number;

  @IsEnum(FiscalRegime, {
    message: 'Regime fiscal inválido.',
  })
  @IsIn(
    [
      FiscalRegime.GERAL,
      FiscalRegime.SIMPLIFICADO,
    ],
    {
      message:
        'Seleccione um regime fiscal válido: GERAL ou SIMPLIFICADO.',
    },
  )
  regime!: FiscalRegime;

  @IsString({
    message: 'A palavra-passe deve ser um texto.',
  })
  @IsNotEmpty({
    message: 'A palavra-passe é obrigatória.',
  })
  @MinLength(6, {
    message:
      'A palavra-passe deve ter pelo menos 6 caracteres.',
  })
  password!: string;

  @IsBoolean({
    message:
      'A aceitação dos termos deve ser verdadeira ou falsa.',
  })
  acceptTerms!: boolean;

  @IsBoolean({
    message:
      'A aceitação da política deve ser verdadeira ou falsa.',
  })
  acceptPrivacyPolicy!: boolean;

  @IsBoolean({
    message:
      'A confirmação das informações deve ser verdadeira ou falsa.',
  })
  confirmInformation!: boolean;
}