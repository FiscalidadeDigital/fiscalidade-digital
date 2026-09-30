import {
  EmployeeStatus,
  SocialSecurityCategory,
} from '@prisma/client';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateEmployeeDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  name?: string;

  @IsOptional()
  @IsString()
  nif?: string | null;

  @IsOptional()
  @IsString()
  socialSecurityNumber?: string | null;

  @ValidateIf((_object, value) => value !== undefined)
  @IsEnum(SocialSecurityCategory)
  socialSecurityCategory?: SocialSecurityCategory;

  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsString()
  address?: string | null;

  @IsOptional()
  @IsDateString()
  birthDate?: string | null;

  @IsOptional()
  @IsDateString()
  hireDate?: string | null;

  @IsOptional()
  @IsDateString()
  terminationDate?: string | null;

  @IsOptional()
  @IsString()
  jobTitle?: string | null;

  @IsOptional()
  @IsString()
  department?: string | null;

  @IsOptional()
  @IsString()
  maritalStatus?: string | null;

  @IsOptional()
  @IsString()
  gender?: string | null;

  @ValidateIf((_object, value) => value !== undefined)
  @IsInt()
  @Min(0)
  dependentCount?: number;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @ValidateIf((_object, value) => value !== undefined)
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;
}
