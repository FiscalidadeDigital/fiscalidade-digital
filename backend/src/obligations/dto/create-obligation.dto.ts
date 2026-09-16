import {
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateObligationDto {
  /**
   * Ano do calendário fiscal que será utilizado.
   *
   * Se não for informado, o service utilizará
   * o ano fiscal atual.
   */
  @IsOptional()
  @IsInt()
  @Min(2000)
  referenceYear?: number;
}