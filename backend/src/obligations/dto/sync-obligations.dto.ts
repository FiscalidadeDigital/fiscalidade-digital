import {
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';

export class SyncObligationsDto {
  /**
   * Ano do calendário fiscal oficial da AGT.
   *
   * Caso não seja informado, será utilizado
   * o ano fiscal atual.
   */
  @IsOptional()
  @IsInt()
  @Min(2000)
  referenceYear?: number;
}