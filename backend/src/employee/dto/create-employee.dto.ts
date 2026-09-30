import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  Matches,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  EmployeeStatus,
  SocialSecurityCategory,
} from '@prisma/client';
import { CreateEmployeeSalaryDto } from './create-employee-salary.dto';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
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
  @IsEnum(SocialSecurityCategory)
  socialSecurityCategory?: SocialSecurityCategory;

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
  @IsString()
  gender?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  dependentCount?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateEmployeeSalaryDto)
  initialSalary?: CreateEmployeeSalaryDto;
}
