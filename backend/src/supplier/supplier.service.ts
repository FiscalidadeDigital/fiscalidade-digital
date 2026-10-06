import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SearchSuppliersDto } from './dto/search-suppliers.dto';

@Injectable()
export class SupplierService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // =====================================================
  // CRIAR FORNECEDOR
  // =====================================================

  async create(
    tenantId: string,
    dto: CreateSupplierDto,
  ) {
    const name = dto.name.trim();

    return this.prisma.supplier.create({
      data: {
        tenantId,

        name,

        nif:
          dto.nif?.trim() ||
          null,

        email:
          dto.email?.trim() ||
          null,

        phone:
          dto.phone?.trim() ||
          null,

        address:
          dto.address?.trim() ||
          null,

        notes:
          dto.notes?.trim() ||
          null,
      },
    });
  }

  // =====================================================
  // LISTAR FORNECEDORES
  // =====================================================

  async findAll(
    tenantId: string,
  ) {
    return this.prisma.supplier.findMany({
      where: {
        tenantId,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findPage(tenantId: string, query: SearchSuppliersDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();
    const where: Prisma.SupplierWhereInput = {
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
    } as Prisma.SupplierOrderByWithRelationInput;
    const [total, suppliers, directoryTotal, withEmail, withPhone] =
      await this.prisma.$transaction([
        this.prisma.supplier.count({ where }),
        this.prisma.supplier.findMany({
          where,
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        this.prisma.supplier.count({ where: { tenantId } }),
        this.prisma.supplier.count({ where: { tenantId, email: { not: null } } }),
        this.prisma.supplier.count({ where: { tenantId, phone: { not: null } } }),
      ]);

    return {
      data: suppliers,
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
  // BUSCAR FORNECEDOR
  // =====================================================

  async findOne(
    tenantId: string,
    id: string,
  ) {
    const supplier =
      await this.prisma.supplier.findFirst({
        where: {
          id,
          tenantId,
        },
      });

    if (!supplier) {
      throw new NotFoundException(
        'Fornecedor não encontrado.',
      );
    }

    return supplier;
  }

  // =====================================================
  // ATUALIZAR FORNECEDOR
  // =====================================================

  async update(
    tenantId: string,
    id: string,
    dto: UpdateSupplierDto,
  ) {
    await this.findOne(
      tenantId,
      id,
    );

    return this.prisma.supplier.update({
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
        ...(dto.notes !== undefined && {
          notes: dto.notes?.trim() || null,
        }),
      },
    });
  }

  // =====================================================
  // ELIMINAR FORNECEDOR
  // =====================================================

  async remove(
    tenantId: string,
    id: string,
  ) {
    await this.findOne(
      tenantId,
      id,
    );

    const purchaseInvoiceCount =
      await this.prisma.purchaseInvoice.count({
        where: {
          tenantId,
          supplierId: id,
        },
      });

    if (purchaseInvoiceCount > 0) {
      throw new ConflictException(
        'O fornecedor possui facturas de compra e não pode ser eliminado.',
      );
    }

    return this.prisma.supplier.delete({
      where: {
        id,
      },
    });
  }

  // =====================================================
  // PESQUISAR FORNECEDORES
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

    return this.prisma.supplier.findMany({
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
  // CONTAR FORNECEDORES
  // =====================================================

  async count(
    tenantId: string,
  ) {
    return this.prisma.supplier.count({
      where: {
        tenantId,
      },
    });
  }
}
