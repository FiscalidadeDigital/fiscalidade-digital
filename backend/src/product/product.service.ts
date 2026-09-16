import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // =====================================================
  // CRIAR PRODUTO
  // =====================================================

  async create(
    tenantId: string,
    body: any,
  ) {
    const name =
      typeof body?.name === 'string'
        ? body.name.trim()
        : '';

    if (!name) {
      throw new Error(
        'O nome do produto é obrigatório.',
      );
    }

    return this.prisma.product.create({
      data: {
        ...body,
        tenantId,
        name,
      },
    });
  }

  // =====================================================
  // LISTAR PRODUTOS DA EMPRESA
  // =====================================================

  async findAll(
    tenantId: string,
  ) {
    return this.prisma.product.findMany({
      where: {
        tenantId,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // =====================================================
  // BUSCAR PRODUTO
  // =====================================================

  async findOne(
    tenantId: string,
    id: string,
  ) {
    const product =
      await this.prisma.product.findFirst({
        where: {
          id,
          tenantId,
        },
      });

    if (!product) {
      throw new NotFoundException(
        'Produto não encontrado.',
      );
    }

    return product;
  }

  // =====================================================
  // ATUALIZAR PRODUTO
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

    const data = {
      ...body,
    };

    // Nunca permitir alterar a empresa
    // através do body enviado pelo frontend.
    delete data.tenantId;
    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;

    if (
      data.name !== undefined &&
      typeof data.name === 'string'
    ) {
      data.name =
        data.name.trim();
    }

    return this.prisma.product.update({
      where: {
        id,
      },

      data,
    });
  }

  // =====================================================
  // ELIMINAR PRODUTO
  // =====================================================

  async remove(
    tenantId: string,
    id: string,
  ) {
    await this.findOne(
      tenantId,
      id,
    );

    return this.prisma.product.delete({
      where: {
        id,
      },
    });
  }

  // =====================================================
  // PESQUISAR PRODUTOS
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

    return this.prisma.product.findMany({
      where: {
        tenantId,

        OR: [
          {
            name: {
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
  // CONTAR PRODUTOS
  // =====================================================

  async count(
    tenantId: string,
  ) {
    return this.prisma.product.count({
      where: {
        tenantId,
      },
    });
  }
}