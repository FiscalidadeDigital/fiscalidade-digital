import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import {
  DocumentCategory,
  Prisma,
} from '@prisma/client';

import * as fs from 'fs';

import * as path from 'path';
import { getDocumentStorageDirectory } from './document-storage';

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

    await this.validateFileContent(file);

    try {
      const document = await this.prisma.$transaction(async (tx) => {
        const fileSize = BigInt(file.size);
        const reserved = await tx.$executeRaw`
          UPDATE "Tenant"
          SET "storageUsedBytes" = "storageUsedBytes" + ${fileSize}
          WHERE "id" = ${tenantId}
            AND (
              "storageBaseQuotaBytes" IS NULL
              OR "storageUsedBytes" + ${fileSize}
                <= "storageBaseQuotaBytes" + "storageAdditionalBytes"
            )
        `;

        if (reserved !== 1) {
          const tenant = await tx.tenant.findUnique({
            where: { id: tenantId },
            select: { id: true },
          });

          if (!tenant) {
            throw new NotFoundException('Empresa não encontrada.');
          }

          throw new PayloadTooLargeException(
            'O ficheiro ultrapassa o espaço de armazenamento disponível.',
          );
        }

        return tx.document.create({
          data: {
            tenantId,
            name: name?.trim() || file.originalname,
            originalName: file.originalname,
            description: description?.trim() || null,
            category: category || DocumentCategory.OUTROS,
            mimeType: file.mimetype,
            size: file.size,
            filePath: file.filename,
            invoiceId: invoiceId || null,
          },
          include: {
            invoice: {
              select: { id: true, invoiceNumber: true },
            },
          },
        });
      });

      return this.toPublicDocument(document);
    } catch (error) {
      await fs.promises.unlink(file.path).catch(() => undefined);
      throw error;
    }
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

    const documents = await this.prisma.document.findMany({
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

    return documents.map((document) =>
      this.toPublicDocument(document),
    );
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

    return this.toPublicDocument(document);
  }

  async getFile(
    tenantId: string,
    id: string,
  ): Promise<{ path: string; mimeType: string; originalName: string; size: number }> {
    const document = await this.prisma.document.findFirst({
      where: { id, tenantId },
      select: {
        filePath: true,
        mimeType: true,
        originalName: true,
        size: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Documento não encontrado.');
    }

    try {
      const { resolvedFile, stats } = await this.resolveStoredFilePath(
        document.filePath,
      );
      return {
        path: resolvedFile,
        mimeType: document.mimeType,
        originalName: document.originalName,
        size: stats.size,
      };
    } catch {
      throw new NotFoundException('Documento não encontrado.');
    }
  }

  private async validateFileContent(file: DocumentFile) {
    const allowedSignatures: Record<string, (header: Buffer) => boolean> = {
      'application/pdf': (header) => header.subarray(0, 5).toString() === '%PDF-',
      'image/jpeg': (header) => header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff,
      'image/png': (header) => header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
      'image/webp': (header) => header.subarray(0, 4).toString() === 'RIFF' && header.subarray(8, 12).toString() === 'WEBP',
    };
    const signatureMatches = allowedSignatures[file.mimetype];

    if (!signatureMatches || file.size <= 0) {
      await fs.promises.unlink(file.path).catch(() => undefined);
      throw new BadRequestException('O conteúdo do ficheiro não corresponde a um formato permitido.');
    }

    let matchesSignature = false;
    try {
      const handle = await fs.promises.open(file.path, 'r');
      try {
        const header = Buffer.alloc(12);
        const { bytesRead } = await handle.read(header, 0, header.length, 0);
        matchesSignature = signatureMatches(header.subarray(0, bytesRead));
      } finally {
        await handle.close();
      }
    } catch {
      await fs.promises.unlink(file.path).catch(() => undefined);
      throw new BadRequestException('Não foi possível validar o conteúdo do ficheiro.');
    }

    if (!matchesSignature) {
      await fs.promises.unlink(file.path).catch(() => undefined);
      throw new BadRequestException('O conteúdo do ficheiro não corresponde ao tipo declarado.');
    }
  }

  private toPublicDocument(document: any) {
    return {
      id: document.id,
      name: document.name,
      originalName: document.originalName,
      description: document.description,
      category: document.category,
      mimeType: document.mimeType,
      size: document.size,
      invoiceId: document.invoiceId,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      invoice: document.invoice,
    };
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
      tenantStorage,
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

      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          storageBaseQuotaBytes: true,
          storageAdditionalBytes: true,
          storageUsedBytes: true,
        },
      }),
    ]);

    if (!tenantStorage) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    const effectiveQuota =
      tenantStorage.storageBaseQuotaBytes === null
        ? null
        : tenantStorage.storageBaseQuotaBytes +
          tenantStorage.storageAdditionalBytes;
    const availableBytes =
      effectiveQuota === null
        ? null
        : effectiveQuota > tenantStorage.storageUsedBytes
          ? effectiveQuota - tenantStorage.storageUsedBytes
          : BigInt(0);

    return {
      total,

      totalSize:
        totalSize._sum.size || 0,

      storage: {
        unit: 'bytes',
        enforcement:
          effectiveQuota === null ? 'NOT_CONFIGURED' : 'ENFORCED',
        usedBytes: tenantStorage.storageUsedBytes.toString(),
        baseQuotaBytes: tenantStorage.storageBaseQuotaBytes?.toString() ?? null,
        additionalBytes: tenantStorage.storageAdditionalBytes.toString(),
        effectiveQuotaBytes: effectiveQuota?.toString() ?? null,
        availableBytes: availableBytes?.toString() ?? null,
      },

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
    const document = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.document.findFirst({
        where: { id, tenantId },
      });

      if (!existing) {
        throw new NotFoundException('Documento não encontrado.');
      }

      const deleted = await tx.document.deleteMany({
        where: { id: existing.id, tenantId },
      });

      if (deleted.count !== 1) {
        throw new NotFoundException('Documento não encontrado.');
      }

      const fileSize = BigInt(existing.size);
      await tx.$executeRaw`
        UPDATE "Tenant"
        SET "storageUsedBytes" = GREATEST(
          "storageUsedBytes" - ${fileSize},
          0
        )
        WHERE "id" = ${tenantId}
      `;

      return existing;
    });

    const safeFilePath = document.filePath
      ? await this.resolveStoredFilePath(document.filePath)
          .then(({ resolvedFile }) => resolvedFile)
          .catch(() => null)
      : null;

    if (safeFilePath) {
      try {
        await fs.promises.unlink(safeFilePath);
      } catch {
        console.warn('Não foi possível remover o ficheiro privado do documento.');
      }
    }

    return {
      success: true,
      message:
        'Documento eliminado com sucesso.',
    };
  }

  private async resolveStoredFilePath(storedPath: string) {
    const storageRoot = await fs.promises.realpath(
      getDocumentStorageDirectory(),
    );
    const legacyRelativePath = storedPath.replace(/\\/g, '/');
    const relativeStoredPath = legacyRelativePath.startsWith('uploads/documents/')
      ? legacyRelativePath.slice('uploads/documents/'.length)
      : storedPath;
    const resolvedFile = await fs.promises.realpath(
      path.isAbsolute(storedPath)
        ? storedPath
        : path.resolve(storageRoot, relativeStoredPath),
    );
    const relative = path.relative(storageRoot, resolvedFile);
    const stats = await fs.promises.stat(resolvedFile);

    if (
      !relative ||
      relative === '..' ||
      relative.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relative) ||
      !stats.isFile()
    ) {
      throw new Error('Stored document path is outside private storage');
    }

    return { resolvedFile, stats };
  }
}
