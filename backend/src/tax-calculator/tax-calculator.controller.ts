import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { TaxCalculatorService }
from './tax-calculator.service';

@Controller('tax-calculator')
export class TaxCalculatorController {

  constructor(
    private readonly service:
      TaxCalculatorService,
  ) {}

  @Post('iva')
  calculateIva(
    @Body() body: any,
  ) {
    return this.service.calculateIva(
      body.base,
      body.taxa,
    );
  }

  @Post('retention')
  calculateRetention(
    @Body() body: any,
  ) {
    return this.service.calculateRetention(
      body.valor,
      body.taxa,
    );
  }

  @Post('industrial')
  calculateIndustrial(
    @Body() body: any,
  ) {
    return this.service.calculateIndustrial(
      body.receitas,
      body.custos,
    );
  }
}