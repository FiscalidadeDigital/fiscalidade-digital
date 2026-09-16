import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class LoginDto {
  // =====================================================
  // EMAIL
  // =====================================================

  @IsString()
  @IsNotEmpty({
    message: 'O email é obrigatório.',
  })
  @IsEmail(
    {},
    {
      message: 'Introduza um email válido.',
    },
  )
  email!: string;

  // =====================================================
  // PASSWORD
  // =====================================================

  @IsString()
  @IsNotEmpty({
    message: 'A palavra-passe é obrigatória.',
  })
  @MinLength(6, {
    message:
      'A palavra-passe deve ter pelo menos 6 caracteres.',
  })
  password!: string;
}