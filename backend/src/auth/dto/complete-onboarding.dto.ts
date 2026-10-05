import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { FiscalRegime, TaxType } from '@prisma/client';

export class OnboardingEnrollmentDto {
  @IsEnum(TaxType) taxType!: TaxType;
  @IsEnum(FiscalRegime) regime!: FiscalRegime;
  @IsString() @IsNotEmpty() validFrom!: string;
  @IsOptional() @IsString() validUntil?: string;
  @IsOptional() @IsString() legalReference?: string;
}

export class CompleteOnboardingDto {
  @IsString() @IsNotEmpty() onboardingToken!: string;
  @IsString() @IsNotEmpty() companyName!: string;
  @IsString() @IsNotEmpty() nif!: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() sector?: string;
  @IsOptional() @IsString() companyType?: string;
  @IsOptional() @IsInt() @Min(0) employees?: number;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => OnboardingEnrollmentDto)
  enrollments?: OnboardingEnrollmentDto[];
}
