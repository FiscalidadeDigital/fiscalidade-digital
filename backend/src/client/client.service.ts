import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    tenantId: string,
    body: any,
  ) {
    return this.prisma.client.create({
      data: {
        tenantId,

        name: body.name,

        nif: body.nif,

        email: body.email,

        phone: body.phone,

        address: body.address,
      },
    });
  }

  async findAll(
    tenantId: string,
  ) {
    return this.prisma.client.findMany({
      where: {
        tenantId,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(
    tenantId: string,
    id: string,
  ) {
    const client =
      await this.prisma.client.findFirst({
        where: {
          id,
          tenantId,
        },
      });

    if (!client) {
      throw new NotFoundException(
        'Cliente não encontrado',
      );
    }

    return client;
  }

  async update(
    tenantId: string,
    id: string,
    body: any,
  ) {
    await this.findOne(
      tenantId,
      id,
    );

    return this.prisma.client.update({
      where: {
        id,
      },

      data: {
        name: body.name,
        nif: body.nif,
        email: body.email,
        phone: body.phone,
        address: body.address,
      },
    });
  }

  async remove(
    tenantId: string,
    id: string,
  ) {
    await this.findOne(
      tenantId,
      id,
    );

    return this.prisma.client.delete({
      where: {
        id,
      },
    });
  }
}