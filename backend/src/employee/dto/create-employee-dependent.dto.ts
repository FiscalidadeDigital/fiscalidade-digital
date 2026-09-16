import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateEmployeeDependentDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  relationship?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsBoolean()
  taxDependent?: boolean;
}
