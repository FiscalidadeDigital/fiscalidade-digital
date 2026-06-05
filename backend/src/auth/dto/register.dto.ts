import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  companyName!: string;

  @IsNotEmpty()
  ownerName!: string;

  @IsNotEmpty()
  nif!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  phone?: string;

  @IsOptional()
  address?: string;

  @IsOptional()
  sector?: string;

  @IsOptional()
  companyType?: string;

  @IsOptional()
  employees?: number;

  @IsOptional()
  regime?: string;

  @MinLength(6)
  password!: string;
}