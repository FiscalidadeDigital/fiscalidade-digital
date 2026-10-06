import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
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
  @IsArray() @ArrayMinSize(1, { message: 'Indique pelo menos uma situação fiscal declarada.' }) @ValidateNested({ each: true }) @Type(() => OnboardingEnrollmentDto)
  enrollments!: OnboardingEnrollmentDto[];
}
