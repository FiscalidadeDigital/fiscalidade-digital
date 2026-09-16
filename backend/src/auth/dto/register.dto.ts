import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

import { FiscalRegime } from '@prisma/client';

export class RegisterDto {
  // =====================================================
  // EMPRESA
  // =====================================================

  @IsString({
    message: 'O nome da empresa deve ser um texto.',
  })
  @IsNotEmpty({
    message: 'O nome da empresa é obrigatório.',
  })
  companyName!: string;

  // =====================================================
  // RESPONSÁVEL
  // =====================================================

  @IsString({
    message: 'O nome do responsável deve ser um texto.',
  })
  @IsNotEmpty({
    message: 'O nome do responsável é obrigatório.',
  })
  ownerName!: string;

  // =====================================================
  // NIF
  // =====================================================

  @IsString({
    message: 'O NIF deve ser um texto.',
  })
  @IsNotEmpty({
    message: 'O NIF é obrigatório.',
  })
  nif!: string;

  // =====================================================
  // EMAIL
  // =====================================================

  @IsEmail(
    {},
    {
      message: 'Introduza um email válido.',
    },
  )
  email!: string;

  // =====================================================
  // TELEFONE
  // =====================================================

  @IsOptional()
  @IsString({
    message: 'O telefone deve ser um texto.',
  })
  phone?: string;

  // =====================================================
  // MORADA
  // =====================================================

  @IsOptional()
  @IsString({
    message: 'A morada deve ser um texto.',
  })
  address?: string;

  // =====================================================
  // SETOR
  // =====================================================

  @IsOptional()
  @IsString({
    message: 'O setor deve ser um texto.',
  })
  sector?: string;

  // =====================================================
  // TIPO DE EMPRESA
  // =====================================================

  @IsOptional()
  @IsString({
    message:
      'O tipo de empresa deve ser um texto.',
  })
  companyType?: string;

  // =====================================================
  // NÚMERO DE FUNCIONÁRIOS
  // =====================================================

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

  // =====================================================
  // REGIME FISCAL
  // =====================================================

  @IsEnum(FiscalRegime, {
    message:
      'Regime fiscal inválido. Selecione GERAL, SIMPLIFICADO ou PRESTADOR_SERVICO.',
  })
  regime!: FiscalRegime;

  // =====================================================
  // PASSWORD
  // =====================================================

  @IsString({
    message:
      'A palavra-passe deve ser um texto.',
  })
  @IsNotEmpty({
    message:
      'A palavra-passe é obrigatória.',
  })
  @MinLength(6, {
    message:
      'A palavra-passe deve ter pelo menos 6 caracteres.',
  })
  password!: string;
}