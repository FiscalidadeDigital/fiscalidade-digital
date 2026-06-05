import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { ProductService } from './product.service';

@Controller('products')
export class ProductController {
  constructor(
    private readonly service: ProductService,
  ) {}

  @Post()
  create(
    @Body() body: any,
  ) {
    return this.service.create(body);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.service.update(
      id,
      body,
    );
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
  ) {
    return this.service.remove(id);
  }
}