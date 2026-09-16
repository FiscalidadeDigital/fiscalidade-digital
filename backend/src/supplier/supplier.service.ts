import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateSupplierDto } from './dto/create-supplier.dto';

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
    const name =
      dto.name?.trim();

    if (!name) {
      throw new Error(
        'O nome do fornecedor é obrigatório.',
      );
    }

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
    dto: CreateSupplierDto,
  ) {
    await this.findOne(
      tenantId,
      id,
    );

    const name =
      dto.name?.trim();

    if (!name) {
      throw new Error(
        'O nome do fornecedor é obrigatório.',
      );
    }

    return this.prisma.supplier.update({
      where: {
        id,
      },

      data: {
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