import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

/** First step only. Company and fiscal data belong to the authenticated onboarding. */
export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome completo é obrigatório.' })
  name!: string;

  @IsEmail({}, { message: 'Introduza um email válido.' })
  email!: string;

  @IsString()
  @MinLength(12, { message: 'A palavra-passe deve ter pelo menos 12 caracteres.' })
  password!: string;

  @IsString()
  @MinLength(12, { message: 'A confirmação deve ter pelo menos 12 caracteres.' })
  confirmPassword!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsBoolean()
  @IsIn([true], { message: 'É necessário aceitar os termos.' })
  acceptTerms!: boolean;

  @IsBoolean()
  @IsIn([true], { message: 'É necessário aceitar a política de privacidade.' })
  acceptPrivacyPolicy!: boolean;
}
