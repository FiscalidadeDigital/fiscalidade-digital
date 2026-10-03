import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class SaftPeriodQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  fiscalYear: number;
}
