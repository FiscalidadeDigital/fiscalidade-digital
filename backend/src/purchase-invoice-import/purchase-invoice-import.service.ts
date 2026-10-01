import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PurchaseInvoiceImportStatus } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

import { getDocumentStorageDirectory } from '../document/document-storage';
import { PrismaService } from '../prisma/prisma.service';
import { PurchaseInvoiceService } from '../purchase-invoice/purchase-invoice.service';
import { ConfirmPurchaseInvoiceImportDto } from './dto/confirm-purchase-invoice-import.dto';
import { configuredInvoiceExtractionProvider } from './invoice-extraction.provider';

@Injectable()
export class PurchaseInvoiceImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly purchaseInvoiceService: PurchaseInvoiceService,
  ) {}

  async create(tenantId: string, uploadedById: string, documentId: string) {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, tenantId },
      select: { id: true, originalName: true, mimeType: true, filePath: true },
    });
    if (!document) {
      throw new NotFoundException('O documento indicado não pertence à empresa.');
    }

    try {
      const provider = configuredInvoiceExtractionProvider();
      let candidate: Prisma.InputJsonValue | null = null;
      let extractionFailed = false;
      if (provider.name !== 'MANUAL') {
        try {
          candidate = await this.extractCandidate(provider, document) as Prisma.InputJsonValue | null;
        } catch {
          extractionFailed = true;
        }
      }
      const created = await this.prisma.purchaseInvoiceImport.create({
        data: {
          tenantId,
          documentId: document.id,
          uploadedById,
          status: PurchaseInvoiceImportStatus.REVIEW_REQUIRED,
          extractionProvider: provider.name,
          providerVersion: provider.version,
          candidateData: candidate ?? Prisma.JsonNull,
          errorCode: extractionFailed ? 'OCR_EXTRACTION_FAILED' : null,
          errorMessage: extractionFailed ? 'A extracção não ficou disponível; reveja o documento manualmente.' : null,
        },
        include: this.include,
      });
      await this.audit(tenantId, uploadedById, 'PURCHASE_INVOICE_IMPORT_CREATED', created.id, {
        documentId: document.id,
        extractionProvider: provider.name,
        extracted: Boolean(candidate),
      });
      return created;
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Este documento já está associado a uma importação.');
      }
      throw error;
    }
  }

  private async extractCandidate(
    provider: ReturnType<typeof configuredInvoiceExtractionProvider>,
    document: { id: string; originalName: string; mimeType: string; filePath: string },
  ) {
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(document.mimeType)) return null;
    const storageRoot = await fs.realpath(getDocumentStorageDirectory());
    const storedPath = path.resolve(storageRoot, document.filePath);
    const relative = path.relative(storageRoot, storedPath);
    if (!relative || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      throw new Error('OCR_DOCUMENT_PATH_INVALID');
    }
    const content = await fs.readFile(storedPath);
    return provider.extract({ id: document.id, originalName: document.originalName, mimeType: document.mimeType, content });
  }

  async findAll(tenantId: string) {
    return this.prisma.purchaseInvoiceImport.findMany({
      where: { tenantId },
      include: this.include,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const record = await this.prisma.purchaseInvoiceImport.findFirst({
      where: { id, tenantId },
      include: this.include,
    });
    if (!record) throw new NotFoundException('Importação de factura recebida não encontrada.');
    return record;
  }

  async confirm(
    tenantId: string,
    userId: string,
    importId: string,
    dto: ConfirmPurchaseInvoiceImportDto,
  ) {
    const record = await this.findOne(tenantId, importId);
    if (record.confirmedPurchaseInvoice) return record.confirmedPurchaseInvoice;
    if (
      record.status !== PurchaseInvoiceImportStatus.REVIEW_REQUIRED &&
      record.status !== PurchaseInvoiceImportStatus.READY
    ) {
      throw new BadRequestException('Esta importação não está pronta para revisão e confirmação.');
    }

    try {
      const purchaseInvoice = await this.purchaseInvoiceService.create(tenantId, userId, {
        ...dto,
        originalDocumentId: record.documentId,
      });
      await this.prisma.purchaseInvoiceImport.update({
        where: { id: record.id },
        data: {
          status: PurchaseInvoiceImportStatus.CONFIRMED,
          confirmedPurchaseInvoiceId: purchaseInvoice.id,
          errorCode: null,
          errorMessage: null,
        },
      });
      await this.audit(tenantId, userId, 'PURCHASE_INVOICE_IMPORT_CONFIRMED', record.id, {
        purchaseInvoiceId: purchaseInvoice.id,
      });
      return purchaseInvoice;
    } catch (error: unknown) {
      if (error instanceof ConflictException) {
        const existing = await this.prisma.purchaseInvoice.findFirst({
          where: { tenantId, originalDocumentId: record.documentId },
        });
        if (existing) {
          await this.prisma.purchaseInvoiceImport.update({
            where: { id: record.id },
            data: {
              status: PurchaseInvoiceImportStatus.CONFIRMED,
              confirmedPurchaseInvoiceId: existing.id,
            },
          });
          return existing;
        }
      }
      throw error;
    }
  }

  private readonly include = {
    document: {
      select: { id: true, originalName: true, mimeType: true, size: true },
    },
    confirmedPurchaseInvoice: {
      select: { id: true, invoiceNumber: true, totalAmount: true, total: true },
    },
  } as const;

  private async audit(
    tenantId: string,
    userId: string,
    action: string,
    entityId: string,
    newData: Prisma.InputJsonValue,
  ) {
    await this.prisma.auditLog.create({
      data: { tenantId, userId, action, entity: 'PurchaseInvoiceImport', entityId, newData },
    });
  }
}
