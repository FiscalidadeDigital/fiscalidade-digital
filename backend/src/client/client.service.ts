import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  PrismaService,
} from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { SearchClientsDto } from './dto/search-clients.dto';

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
    dto: CreateClientDto,
  ) {
    return this.prisma.client.create({
      data: {
        tenantId,

        name:
          dto.name.trim(),

        nif:
          dto.nif?.trim() || null,

        email:
          dto.email?.trim() || null,

        phone:
          dto.phone?.trim() || null,

        address:
          dto.address?.trim() || null,

        city:
          dto.city?.trim() || null,

        notes:
          dto.notes?.trim() || null,
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

  async findPage(tenantId: string, query: SearchClientsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();
    const where: Prisma.ClientWhereInput = {
      tenantId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { nif: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const orderBy = {
      [query.sortBy ?? 'name']: query.sortDirection ?? 'asc',
    } as Prisma.ClientOrderByWithRelationInput;
    const [total, clients, directoryTotal, withEmail, withPhone] =
      await this.prisma.$transaction([
        this.prisma.client.count({ where }),
        this.prisma.client.findMany({
          where,
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        this.prisma.client.count({ where: { tenantId } }),
        this.prisma.client.count({ where: { tenantId, email: { not: null } } }),
        this.prisma.client.count({ where: { tenantId, phone: { not: null } } }),
      ]);

    return {
      data: clients,
      summary: { total: directoryTotal, withEmail, withPhone },
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
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
    dto: UpdateClientDto,
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
        ...(dto.name !== undefined && {
          name: dto.name.trim(),
        }),
        ...(dto.nif !== undefined && {
          nif: dto.nif?.trim() || null,
        }),
        ...(dto.email !== undefined && {
          email: dto.email?.trim() || null,
        }),
        ...(dto.phone !== undefined && {
          phone: dto.phone?.trim() || null,
        }),
        ...(dto.address !== undefined && {
          address: dto.address?.trim() || null,
        }),
        ...(dto.city !== undefined && {
          city: dto.city?.trim() || null,
        }),
        ...(dto.notes !== undefined && {
          notes: dto.notes?.trim() || null,
        }),
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

    const invoiceCount =
      await this.prisma.invoice.count({
        where: {
          tenantId,
          clientId: id,
        },
      });

    if (invoiceCount > 0) {
      throw new ConflictException(
        'O cliente possui facturas e não pode ser eliminado.',
      );
    }

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
