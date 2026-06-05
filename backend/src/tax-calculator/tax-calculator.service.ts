import { Injectable } from '@nestjs/common';

@Injectable()
export class TaxCalculatorService {

  calculateIva(
    base: number,
    taxa: number,
  ) {
    const iva =
      (base * taxa) / 100;

    return {
      base,
      taxa,
      iva,
      total: base + iva,
    };
  }

  calculateRetention(
    valor: number,
    taxa: number,
  ) {
    const retencao =
      (valor * taxa) / 100;

    return {
      valor,
      taxa,
      retencao,
      liquido: valor - retencao,
    };
  }

  calculateIndustrial(
    receitas: number,
    custos: number,
  ) {
    const lucro =
      receitas - custos;

    const imposto =
      lucro > 0
        ? lucro * 0.25
        : 0;

    return {
      receitas,
      custos,
      lucro,
      imposto,
    };
  }
}