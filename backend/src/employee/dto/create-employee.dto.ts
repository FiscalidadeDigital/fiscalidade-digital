import {
  IsDateString,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  employeeNumber?: string;

  @IsOptional()
  @IsString()
  nif?: string;

  @IsOptional()
  @IsString()
  socialSecurityNumber?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsDateString()
  hireDate?: string;

  @IsOptional()
  @IsDateString()
  terminationDate?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  maritalStatus?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  dependentCount?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
