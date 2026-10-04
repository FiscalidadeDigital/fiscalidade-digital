import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { RemunerationComponentType } from '@prisma/client';

/** The user chooses the business component; tax treatment is resolved server-side. */
export class CreateRemunerationComponentDto {
  @IsEnum(RemunerationComponentType)
  type: RemunerationComponentType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @IsDateString()
  effectiveFrom: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
