import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductsDto } from './dto/search-products.dto';

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
    body: CreateProductDto,
  ) {
    return this.prisma.product.create({
      data: {
        tenantId,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        price: body.price,
        priceAmount: new Prisma.Decimal(String(body.price)).toDecimalPlaces(
          2,
          Prisma.Decimal.ROUND_HALF_UP,
        ),
        ivaRate: body.ivaRate,
        code: body.code?.trim() || null,
        isActive: body.isActive,
        stock: body.stock,
        stockAmount:
          body.stock === undefined
            ? undefined
            : body.stock === null
              ? null
              : new Prisma.Decimal(String(body.stock)).toDecimalPlaces(
                  4,
                  Prisma.Decimal.ROUND_HALF_UP,
                ),
        unit: body.unit ?? 'UN',
        electronicOperationType: body.electronicOperationType ?? null,
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

  async findPage(tenantId: string, query: SearchProductsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();
    const where: Prisma.ProductWhereInput = {
      tenantId,
      ...(query.status ? { isActive: query.status === 'ACTIVE' } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const orderBy = {
      [query.sortBy ?? 'name']: query.sortDirection ?? 'asc',
    } as Prisma.ProductOrderByWithRelationInput;

    const [total, products, active, inactive] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.product.count({ where: { tenantId, isActive: true } }),
      this.prisma.product.count({ where: { tenantId, isActive: false } }),
    ]);

    return {
      data: products,
      summary: { total: active + inactive, active, inactive },
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
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
    body: UpdateProductDto,
  ) {
    await this.findOne(
      tenantId,
      id,
    );

    return this.prisma.product.update({
      where: {
        id,
      },

      data: {
        name: body.name?.trim(),
        description:
          body.description === undefined
            ? undefined
            : body.description?.trim() || null,
        price: body.price,
        priceAmount:
          body.price === undefined
            ? undefined
            : new Prisma.Decimal(String(body.price)).toDecimalPlaces(
                2,
                Prisma.Decimal.ROUND_HALF_UP,
              ),
        ivaRate: body.ivaRate,
        code:
          body.code === undefined
            ? undefined
            : body.code?.trim() || null,
        isActive: body.isActive,
        stock: body.stock,
        stockAmount:
          body.stock === undefined
            ? undefined
            : body.stock === null
              ? null
              : new Prisma.Decimal(String(body.stock)).toDecimalPlaces(
                  4,
                  Prisma.Decimal.ROUND_HALF_UP,
                ),
        unit: body.unit,
        electronicOperationType: body.electronicOperationType,
      },
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

    const [invoiceItems, purchaseInvoiceItems] = await Promise.all([
      this.prisma.invoiceItem.count({ where: { productId: id } }),
      this.prisma.purchaseInvoiceItem.count({ where: { productId: id } }),
    ]);

    if (invoiceItems + purchaseInvoiceItems > 0) {
      throw new ConflictException(
        'O produto não pode ser eliminado porque está associado a documentos.',
      );
    }

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
          {
            code: {
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
