import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  PrismaService,
} from '../prisma/prisma.service';

@Injectable()
export class ClientService {

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // =====================================================
  // CRIAR CLIENTE
  // =====================================================

  async create(
    tenantId: string,
    body: any,
  ) {
    if (
      !body.name ||
      !body.name.trim()
    ) {
      throw new Error(
        'O nome do cliente é obrigatório.',
      );
    }

    return this.prisma.client.create({
      data: {
        tenantId,

        name:
          body.name.trim(),

        nif:
          body.nif?.trim() || null,

        email:
          body.email?.trim() || null,

        phone:
          body.phone?.trim() || null,

        address:
          body.address?.trim() || null,

        notes:
          body.notes?.trim() || null,
      },
    });
  }

  // =====================================================
  // LISTAR TODOS OS CLIENTES
  // =====================================================

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

  // =====================================================
  // BUSCAR CLIENTE POR ID
  // =====================================================

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

        include: {
          invoices: {
            orderBy: {
              issuedAt: 'desc',
            },
          },
        },
      });

    if (!client) {
      throw new NotFoundException(
        'Cliente não encontrado.',
      );
    }

    return client;
  }

  // =====================================================
  // ATUALIZAR CLIENTE
  // =====================================================

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
        name:
          body.name !== undefined
            ? body.name.trim()
            : undefined,

        nif:
          body.nif !== undefined
            ? body.nif?.trim() || null
            : undefined,

        email:
          body.email !== undefined
            ? body.email?.trim() || null
            : undefined,

        phone:
          body.phone !== undefined
            ? body.phone?.trim() || null
            : undefined,

        address:
          body.address !== undefined
            ? body.address?.trim() || null
            : undefined,

        notes:
          body.notes !== undefined
            ? body.notes?.trim() || null
            : undefined,
      },
    });
  }

  // =====================================================
  // ELIMINAR CLIENTE
  // =====================================================

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

  // =====================================================
  // PESQUISAR CLIENTES
  // =====================================================

  async search(
    tenantId: string,
    query: string,
  ) {
    const search =
      query?.trim();

    if (!search) {
      return this.findAll(
        tenantId,
      );
    }

    return this.prisma.client.findMany({
      where: {
        tenantId,

        OR: [
          {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },

          {
            nif: {
              contains: search,
              mode: 'insensitive',
            },
          },

          {
            email: {
              contains: search,
              mode: 'insensitive',
            },
          },

          {
            phone: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ],
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // =====================================================
  // CONTAR CLIENTES
  // =====================================================

  async count(
    tenantId: string,
  ) {
    return this.prisma.client.count({
      where: {
        tenantId,
      },
    });
  }
}