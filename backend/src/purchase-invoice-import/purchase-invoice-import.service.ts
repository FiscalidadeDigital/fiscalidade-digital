import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PurchaseInvoiceImportStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { PurchaseInvoiceService } from '../purchase-invoice/purchase-invoice.service';
import { ConfirmPurchaseInvoiceImportDto } from './dto/confirm-purchase-invoice-import.dto';

@Injectable()
export class PurchaseInvoiceImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly purchaseInvoiceService: PurchaseInvoiceService,
  ) {}

  async create(tenantId: string, uploadedById: string, documentId: string) {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, tenantId },
      select: { id: true, originalName: true, mimeType: true },
    });
    if (!document) {
      throw new NotFoundException('O documento indicado não pertence à empresa.');
    }

    try {
      const created = await this.prisma.purchaseInvoiceImport.create({
        data: {
          tenantId,
          documentId: document.id,
          uploadedById,
          status: PurchaseInvoiceImportStatus.REVIEW_REQUIRED,
          extractionProvider: 'MANUAL',
        },
        include: this.include,
      });
      await this.audit(tenantId, uploadedById, 'PURCHASE_INVOICE_IMPORT_CREATED', created.id, {
        documentId: document.id,
        extractionProvider: 'MANUAL',
      });
      return created;
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Este documento já está associado a uma importação.');
      }
      throw error;
    }
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
