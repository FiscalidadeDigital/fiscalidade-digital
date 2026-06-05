import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(body: any) {
    return this.prisma.product.create({
      data: body,
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.product.findUnique({
      where: {
        id,
      },
    });
  }

  async update(
    id: string,
    body: any,
  ) {
    return this.prisma.product.update({
      where: {
        id,
      },
      data: body,
    });
  }

  async remove(id: string) {
    return this.prisma.product.delete({
      where: {
        id,
      },
    });
  }
}