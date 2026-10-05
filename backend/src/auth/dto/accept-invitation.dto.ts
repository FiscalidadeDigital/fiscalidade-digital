import { IsBoolean, IsIn, IsString, MinLength } from 'class-validator';

export class AcceptInvitationDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(12)
  password!: string;

  @IsString()
  @MinLength(12)
  confirmPassword!: string;

  @IsBoolean()
  @IsIn([true], { message: 'É necessário aceitar os Termos de Utilização.' })
  acceptTerms!: boolean;

  @IsBoolean()
  @IsIn([true], { message: 'É necessário aceitar a Política de Privacidade.' })
  acceptPrivacyPolicy!: boolean;
}
