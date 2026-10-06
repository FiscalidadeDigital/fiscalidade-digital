import { Type } from 'class-transformer';
import { IsIn, IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class RequestElectronicSeriesDto {
  @Type(() => Number)
  @IsInt()
  @Min(2025)
  @Max(2200)
  seriesYear!: number;

  @IsIn(['FA', 'FT', 'FR', 'FG', 'GF', 'AC', 'AR', 'TV', 'RC', 'RG', 'RE', 'ND', 'NC', 'AF', 'RP', 'RA', 'CS', 'LD'])
  documentType!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  establishmentNumber!: string;

  @IsIn(['N', 'C'])
  seriesContingencyIndicator!: 'N' | 'C';
}
