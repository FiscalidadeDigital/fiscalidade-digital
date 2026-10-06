import { IsDateString } from 'class-validator';

export class EndRemunerationComponentDto {
  @IsDateString()
  effectiveTo: string;
}
