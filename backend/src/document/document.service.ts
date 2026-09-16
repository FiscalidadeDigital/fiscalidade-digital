import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import {
  DocumentCategory,
  Prisma,
} from '@prisma/client';

import * as fs from 'fs';

import * as path from 'path';

export interface DocumentFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer?: Buffer;
}

interface CreateDocumentParams {
  tenantId: string;
  file: DocumentFile;
  name?: string;
  description?: string;
  category?: DocumentCategory;
  invoiceId?: string;
}

@Injectable()
export class DocumentService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create({
    tenantId,
    file,
    name,
    description,
    category,
    invoiceId,
  }: CreateDocumentParams) {
    if (!file) {
      throw new BadRequestException(
        'Nenhum ficheiro foi enviado.',
      );
    }

    if (!tenantId) {
      throw new BadRequestException(
        'Tenant não identificado.',
      );
    }

    if (invoiceId) {
      const invoice =
        await this.prisma.invoice.findFirst({
          where: {
            id: invoiceId,
            tenantId,
          },
          select: {
            id: true,
            invoiceNumber: true,
          },
        });

      if (!invoice) {
        throw new NotFoundException(
          'A factura indicada não existe ou não pertence à empresa.',
        );
      }
    }

    const fileName = path.basename(
      file.path,
    );

    return this.prisma.document.create({
      data: {
        tenantId,

        name:
          name?.trim() ||
          file.originalname,

        originalName:
          file.originalname,

        description:
          description?.trim() ||
          null,

        category:
          category ||
          DocumentCategory.OUTROS,

        mimeType:
          file.mimetype,

        size:
          file.size,

        filePath:
          file.path,

        fileUrl:
          `/uploads/documents/${fileName}`,

        invoiceId:
          invoiceId || null,
      },

      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
          },
        },
      },
    });
  }

  async findAll(
    tenantId: string,
    options?: {
      search?: string;
      category?: DocumentCategory;
      invoiceId?: string;
    },
  ) {
    if (!tenantId) {
      throw new BadRequestException(
        'Tenant não identificado.',
      );
    }

    const where: Prisma.DocumentWhereInput = {
      tenantId,
    };

    if (options?.category) {
      where.category =
        options.category;
    }

    if (options?.invoiceId) {
      where.invoiceId =
        options.invoiceId;
    }

    if (options?.search?.trim()) {
      const search =
        options.search.trim();

      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          originalName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    return this.prisma.document.findMany({
      where,

      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
          },
        },
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
    const document =
      await this.prisma.document.findFirst({
        where: {
          id,
          tenantId,
        },

        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
            },
          },
        },
      });

    if (!document) {
      throw new NotFoundException(
        'Documento não encontrado.',
      );
    }

    return document;
  }

  async getSummary(
    tenantId: string,
  ) {
    if (!tenantId) {
      throw new BadRequestException(
        'Tenant não identificado.',
      );
    }

    const [
      total,
      facturas,
      recibos,
      declaracoes,
      pagamentos,
      contratos,
      empresa,
      comprovativos,
      relatorios,
      outros,
      totalSize,
    ] = await Promise.all([
      this.prisma.document.count({
        where: { tenantId },
      }),

      this.prisma.document.count({
        where: {
          tenantId,
          category:
            DocumentCategory.FACTURA,
        },
      }),

      this.prisma.document.count({
        where: {
          tenantId,
          category:
            DocumentCategory.RECIBO,
        },
      }),

      this.prisma.document.count({
        where: {
          tenantId,
          category:
            DocumentCategory.DECLARACAO,
        },
      }),

      this.prisma.document.count({
        where: {
          tenantId,
          category:
            DocumentCategory.PAGAMENTO,
        },
      }),

      this.prisma.document.count({
        where: {
          tenantId,
          category:
            DocumentCategory.CONTRATO,
        },
      }),

      this.prisma.document.count({
        where: {
          tenantId,
          category:
            DocumentCategory.EMPRESA,
        },
      }),

      this.prisma.document.count({
        where: {
          tenantId,
          category:
            DocumentCategory.COMPROVATIVO,
        },
      }),

      this.prisma.document.count({
        where: {
          tenantId,
          category:
            DocumentCategory.RELATORIO,
        },
      }),

      this.prisma.document.count({
        where: {
          tenantId,
          category:
            DocumentCategory.OUTROS,
        },
      }),

      this.prisma.document.aggregate({
        where: {
          tenantId,
        },

        _sum: {
          size: true,
        },
      }),
    ]);

    return {
      total,

      totalSize:
        totalSize._sum.size || 0,

      categories: {
        FACTURA: facturas,
        RECIBO: recibos,
        DECLARACAO: declaracoes,
        PAGAMENTO: pagamentos,
        CONTRATO: contratos,
        EMPRESA: empresa,
        COMPROVATIVO:
          comprovativos,
        RELATORIO: relatorios,
        OUTROS: outros,
      },
    };
  }

  async remove(
    tenantId: string,
    id: string,
  ) {
    const document =
      await this.prisma.document.findFirst({
        where: {
          id,
          tenantId,
        },
      });

    if (!document) {
      throw new NotFoundException(
        'Documento não encontrado.',
      );
    }

    await this.prisma.document.delete({
      where: {
        id: document.id,
      },
    });

    if (document.filePath) {
      try {
        if (
          fs.existsSync(
            document.filePath,
          )
        ) {
          fs.unlinkSync(
            document.filePath,
          );
        }
      } catch (error) {
        console.error(
          'Não foi possível remover o ficheiro físico:',
          error,
        );
      }
    }

    return {
      success: true,
      message:
        'Documento eliminado com sucesso.',
    };
  }
}