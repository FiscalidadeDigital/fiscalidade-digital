import PDFDocument from 'pdfkit';
import { renderInvoicePdf } from './invoice-pdf.renderer';

import { Response } from 'express';

import {
  Injectable,
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InvoiceDocumentType, Prisma, TaxType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { ObligationsService } from '../obligations/obligations.service';
import { FiscalEngineService } from '../fiscal-engine/fiscal-engine.service';
import { FiscalSignatureService } from '../fiscal-signature/fiscal-signature.service';
import {
  resolveInvoiceVatPolicy,
  SIMPLIFIED_IVA_INVOICE_MENTION,
} from '../fiscal-rules/iva-rules';

import {
  CreateInvoiceDto,
  CreateInvoiceItemDto,
} from './dto/create-invoice.dto';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { CreateAdjustmentNoteDto } from './dto/create-adjustment-note.dto';
import { calculateInvoiceAmounts } from './invoice-calculator';
import { FiscalEnrollmentService } from '../fiscal-enrollment/fiscal-enrollment.service';

type FiscalDocumentCode = 'FT' | 'PF' | 'NC' | 'ND';
type AdjustmentDocumentCode = 'NC' | 'ND';
const ADJUSTMENT_VALIDATION_RULE_VERSION = 'ADJUSTMENT_VALIDATION_V2';
type FiscalDocumentIdentity = {
  invoiceNumber: string;
  fiscalSeries: string;
  fiscalSequence: number;
};
type AdjustmentValidationStatus =
  | 'VALIDATED'
  | 'RECOVERY_REQUIRED'
  | 'REVIEW_REQUIRED';
type AdjustmentValidation = {
  status: AdjustmentValidationStatus;
  canCreate: boolean;
  message: string;
  checks: Array<{
    label: string;
    passed: boolean;
  }>;
};
type AdjustmentSourceInvoice = Prisma.InvoiceGetPayload<{
  include: { items: true };
}>;
type AdjustmentNoteLine = {
  source: AdjustmentSourceInvoice['items'][number];
  quantity: Prisma.Decimal;
  unitPrice: Prisma.Decimal;
  total: Prisma.Decimal;
  taxRate: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
};
type AdjustmentPreparation = {
  validation: AdjustmentValidation;
  sourceInvoice?: AdjustmentSourceInvoice;
  noteLines?: AdjustmentNoteLine[];
};

// The SAF-T AO code list associates M00 with the invoice mention required for
// the simplified IVA regime. OUT distinguishes that treatment from a normal
// IVA rate without inventing a taxable rate on the commercial document.
const SIMPLIFIED_IVA_SAFT_TAX_CODE = 'OUT';
const SIMPLIFIED_IVA_SAFT_EXEMPTION_CODE = 'M00';

@Injectable()
export class InvoiceService {
  private readonly logger =
    new Logger(InvoiceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly obligationsService: ObligationsService,
    private readonly fiscalEngineService: FiscalEngineService,
    @Optional() private readonly fiscalSignatureService?: FiscalSignatureService,
    private readonly enrollments?: FiscalEnrollmentService,
  ) {}

  // ============================================================
  // CRIAR FACTURA
  // ============================================================

  async create(
    tenantId: string,
    dto: CreateInvoiceDto,
  ) {
    return this.createDocument(tenantId, dto, InvoiceDocumentType.NORMAL);
  }

  async createProForma(tenantId: string, dto: CreateInvoiceDto) {
    return this.createDocument(tenantId, dto, InvoiceDocumentType.PRO_FORMA);
  }

  async createCreditNote(
    tenantId: string,
    dto: CreateAdjustmentNoteDto,
    actorUserId?: string,
  ) {
    return this.createAdjustmentNote(tenantId, dto, 'NC', actorUserId);
  }

  async validateCreditNote(
    tenantId: string,
    dto: CreateAdjustmentNoteDto,
  ) {
    return this.validateAdjustmentNote(tenantId, dto, 'NC');
  }

  async createDebitNote(
    tenantId: string,
    dto: CreateAdjustmentNoteDto,
    actorUserId?: string,
  ) {
    return this.createAdjustmentNote(tenantId, dto, 'ND', actorUserId);
  }

  async validateDebitNote(
    tenantId: string,
    dto: CreateAdjustmentNoteDto,
  ) {
    return this.validateAdjustmentNote(tenantId, dto, 'ND');
  }

  private async validateAdjustmentNote(
    tenantId: string,
    dto: CreateAdjustmentNoteDto,
    documentCode: AdjustmentDocumentCode,
  ): Promise<AdjustmentValidation> {
    const preparation = await this.prepareAdjustmentNote(
      this.prisma,
      tenantId,
      dto,
      documentCode,
    );

    return preparation.validation;
  }

  private async createAdjustmentNote(
    tenantId: string,
    dto: CreateAdjustmentNoteDto,
    documentCode: AdjustmentDocumentCode,
    actorUserId?: string,
  ) {
    if (!dto.operationId) {
      throw new BadRequestException(
        'Não foi possível confirmar esta operação. Actualize a página e tente novamente.',
      );
    }

    const issuedAt = new Date();
    const year = Number(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Luanda',
        year: 'numeric',
      }).format(issuedAt),
    );
    const fiscalSeries = this.fiscalSeriesFor(documentCode, year);

    try {
      const note = await this.prisma.$transaction(async (tx) => {
        // Todas as notas da mesma factura de origem passam por este bloqueio.
        // Assim o saldo de uma linha é relido e confirmado dentro da mesma
        // transacção antes de qualquer novo documento ser emitido.
        const sourceLockKey = `${tenantId}:adjustment:${dto.sourceInvoiceId}`;
        await tx.$queryRaw`
          SELECT pg_advisory_xact_lock(
            hashtextextended(${sourceLockKey}, 0)
          )::text AS lock
        `;

        const existingOperation = await tx.invoice.findFirst({
          where: {
            tenantId,
            adjustmentOperationId: dto.operationId,
          },
          include: { client: true, items: true },
        });
        if (existingOperation) {
          if (
            existingOperation.fiscalDocumentType === documentCode &&
            existingOperation.rectifiesInvoiceId === dto.sourceInvoiceId
          ) {
            return existingOperation;
          }

          throw new ConflictException(
            'Esta operação já foi utilizada para outro documento. Actualize a página e tente novamente.',
          );
        }

        const preparation = await this.prepareAdjustmentNote(
          tx,
          tenantId,
          dto,
          documentCode,
        );
        if (!preparation.validation.canCreate) {
          throw new BadRequestException(preparation.validation.message);
        }

        const { sourceInvoice, noteLines } = preparation;
        if (!sourceInvoice || !noteLines) {
          throw new BadRequestException(
            'A validação automática precisa de ser concluída antes de emitir a nota.',
          );
        }

        const subtotal = noteLines
          .reduce((sum, line) => sum.add(line.total), new Prisma.Decimal(0))
          .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
        const iva = noteLines
          .reduce((sum, line) => sum.add(line.taxAmount), new Prisma.Decimal(0))
          .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
        const sourceSubtotal = this.decimal(
          sourceInvoice.subtotalAmount,
          sourceInvoice.subtotal,
        );
        const sourceWithholding = this.decimal(
          sourceInvoice.withholdingTaxAmount,
          sourceInvoice.withholdingTax,
        );
        const withholdingRate = sourceSubtotal.greaterThan(0)
          ? sourceWithholding.div(sourceSubtotal)
          : new Prisma.Decimal(0);
        const withholdingTax = subtotal
          .mul(withholdingRate)
          .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
        const total = subtotal
          .add(iva)
          .sub(withholdingTax)
          .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

        // The next number and the fiscal hash chain are shared by every
        // document in this tenant/type/year series. Serialise at that scope,
        // not only per source invoice, so concurrent notes cannot reuse a
        // number or sign from the same previous hash.
        const lockKey = `${tenantId}:${documentCode}:${year}`;
        await tx.$queryRaw`
          SELECT pg_advisory_xact_lock(
            hashtextextended(${lockKey}, 0)
          )::text AS lock
        `;

        const fiscalIdentity = await this.getNextFiscalDocumentIdentity(
          tx,
          tenantId,
          year,
          documentCode,
        );
        if (!this.fiscalSignatureService) {
          throw new ServiceUnavailableException({
            code: 'FISCAL_SIGNATURE_NOT_CONFIGURED',
            message: 'Não foi possível emitir o documento neste momento.',
          });
        }

        const previous = await tx.invoice.findFirst({
          where: {
            tenantId,
            fiscalDocumentType: documentCode,
            fiscalSeries,
            fiscalYear: year,
          },
          orderBy: { fiscalSequence: 'desc' },
          select: { fiscalHash: true },
        });
        if (previous && !previous.fiscalHash) {
          throw new ConflictException({
            code: 'LEGACY_UNSIGNED_DOCUMENT',
            message: 'A série contém um documento anterior que precisa de revisão antes de continuar.',
          });
        }

        const signed = this.fiscalSignatureService.sign({
          invoiceDate: issuedAt,
          systemEntryDate: issuedAt,
          invoiceNo: fiscalIdentity.invoiceNumber,
          grossTotal: total.toFixed(2),
          previousHash: previous?.fiscalHash ?? null,
        });

        const note = await tx.invoice.create({
          data: {
            tenantId,
            clientId: sourceInvoice.clientId,
            invoiceNumber: fiscalIdentity.invoiceNumber,
            subtotal: subtotal.toNumber(),
            subtotalAmount: subtotal,
            iva: iva.toNumber(),
            ivaAmount: iva,
            withholdingTax: withholdingTax.toNumber(),
            withholdingTaxAmount: withholdingTax,
            total: total.toNumber(),
            totalAmount: total,
            taxRuleVersion: sourceInvoice.taxRuleVersion,
            taxCalculationStatus: 'RECTIFICATION_FROM_ORIGINAL_DOCUMENT',
            documentType: InvoiceDocumentType.NORMAL,
            fiscalDocumentType: documentCode,
            fiscalSeries: fiscalIdentity.fiscalSeries,
            fiscalYear: year,
            fiscalSequence: fiscalIdentity.fiscalSequence,
            rectifiesInvoiceId: sourceInvoice.id,
            adjustmentOperationId: dto.operationId,
            adjustmentValidationStatus: 'VALIDATED',
            adjustmentValidationRuleVersion:
              ADJUSTMENT_VALIDATION_RULE_VERSION,
            adjustmentValidatedAt: issuedAt,
            fiscalHash: signed.hash,
            fiscalHashControl: signed.hashControl,
            signatureKeyVersion: signed.keyVersion,
            previousFiscalHash: previous?.fiscalHash ?? null,
            notes: dto.reason.trim(),
            status: 'PENDING',
            issuedAt,
            createdAt: issuedAt,
            items: {
              create: noteLines.map((line) => ({
                productId: line.source.productId,
                productName: line.source.productName,
                quantity: line.quantity.toNumber(),
                quantityAmount: line.quantity,
                unitPrice: line.unitPrice.toNumber(),
                unitPriceAmount: line.unitPrice,
                total: line.total.toNumber(),
                totalAmount: line.total,
                unit: line.source.unit,
                taxType: line.source.taxType,
                taxCode: line.source.taxCode,
                taxRate: line.taxRate,
                taxAmount: line.taxAmount,
                taxExemptionCode: line.source.taxExemptionCode,
                taxExemptionReason: line.source.taxExemptionReason,
                electronicOperationType: line.source.electronicOperationType,
                sourceInvoiceItemId: line.source.id,
              })),
            },
          },
          include: { client: true, items: true },
        });

        await tx.auditLog.create({
          data: {
            tenantId,
            userId: actorUserId ?? null,
            action: 'INVOICE_ADJUSTMENT_VALIDATED_AND_ISSUED',
            entity: 'Invoice',
            entityId: note.id,
            newData: {
              automaticValidation: true,
              validationRuleVersion: ADJUSTMENT_VALIDATION_RULE_VERSION,
              documentCode,
              sourceInvoiceId: sourceInvoice.id,
              operationId: dto.operationId,
              subtotal: subtotal.toFixed(2),
              iva: iva.toFixed(2),
              total: total.toFixed(2),
            },
          },
        });

        return note;
      });

      await this.syncFiscalObligations(tenantId);
      return note;
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Não foi possível gerar uma numeração única para o documento. Tente novamente.',
        );
      }

      throw error;
    }
  }

  private async prepareAdjustmentNote(
    client: Pick<PrismaService, 'invoice'>,
    tenantId: string,
    dto: CreateAdjustmentNoteDto,
    documentCode: AdjustmentDocumentCode,
  ): Promise<AdjustmentPreparation> {
    const sourceInvoice = await client.invoice.findFirst({
      where: {
        id: dto.sourceInvoiceId,
        tenantId,
        documentType: InvoiceDocumentType.NORMAL,
        fiscalDocumentType: 'FT',
        status: { not: 'CANCELLED' },
      },
      include: { items: true },
    });

    if (!sourceInvoice) {
      throw new NotFoundException(
        'A factura de origem não está disponível para rectificação.',
      );
    }

    if (sourceInvoice.items.length === 0) {
      return this.adjustmentRecoveryRequired(
        sourceInvoice,
        'Esta factura não contém o detalhe dos artigos ou serviços necessário. Recupere o documento original antes de emitir uma nota.',
        false,
        false,
        documentCode,
      );
    }

    const sourceDetailsComplete = sourceInvoice.items.every((item) =>
      this.hasCompleteAdjustmentLineDetails(item),
    );
    const sourceValuesComplete =
      sourceDetailsComplete && this.hasConsistentAdjustmentSourceAmounts(sourceInvoice);

    if (!sourceValuesComplete) {
      return this.adjustmentRecoveryRequired(
        sourceInvoice,
        'A validação automática identificou dados incompletos na factura de origem. Recupere o documento original antes de emitir a nota.',
        sourceDetailsComplete,
        sourceValuesComplete,
        documentCode,
      );
    }

    const activeAdjustments = await client.invoice.findMany({
      where: {
        tenantId,
        rectifiesInvoiceId: sourceInvoice.id,
        fiscalDocumentType: { in: ['NC', 'ND'] },
        status: { not: 'CANCELLED' },
      },
      select: {
        fiscalDocumentType: true,
        items: {
          select: {
            sourceInvoiceItemId: true,
            quantity: true,
            quantityAmount: true,
            total: true,
            totalAmount: true,
          },
        },
      },
    });

    // As notas emitidas antes deste controlo não têm ligação à linha de
    // origem. Em vez de tentar reconstruir essa associação e alterar o
    // histórico, a emissão adicional fica bloqueada para revisão segura.
    const hasUnlinkedHistoricalAdjustment = activeAdjustments.some((note) =>
      note.items.length === 0 ||
      note.items.some((item) => !item.sourceInvoiceItemId),
    );
    if (hasUnlinkedHistoricalAdjustment) {
      return this.adjustmentRecoveryRequired(
        sourceInvoice,
        'Existe uma rectificação anterior sem o detalhe de linha necessário para calcular o saldo com segurança. Consulte o documento original antes de emitir uma nova nota.',
        sourceDetailsComplete,
        sourceValuesComplete,
        documentCode,
      );
    }

    const creditedBySourceItem = new Map<
      string,
      { quantity: Prisma.Decimal; total: Prisma.Decimal }
    >();
    for (const note of activeAdjustments) {
      if (note.fiscalDocumentType !== 'NC') continue;

      for (const item of note.items) {
        const sourceInvoiceItemId = item.sourceInvoiceItemId;
        if (!sourceInvoiceItemId) continue;

        const current = creditedBySourceItem.get(sourceInvoiceItemId) ?? {
          quantity: new Prisma.Decimal(0),
          total: new Prisma.Decimal(0),
        };
        creditedBySourceItem.set(sourceInvoiceItemId, {
          quantity: current.quantity.add(
            this.decimal(item.quantityAmount, item.quantity),
          ),
          total: current.total.add(this.decimal(item.totalAmount, item.total)),
        });
      }
    }

    const requestedItems = Array.isArray(dto.items) ? dto.items : [];
    const requestedLineIds = requestedItems.map(
      (item) => item.sourceInvoiceItemId,
    );
    if (new Set(requestedLineIds).size !== requestedLineIds.length) {
      return this.adjustmentReviewRequired(
        sourceInvoice,
        'A validação automática não aprovou a nota porque uma linha foi indicada mais de uma vez.',
        sourceDetailsComplete,
        sourceValuesComplete,
        false,
        Boolean(dto.reason?.trim()),
        documentCode,
      );
    }

    const sourceItemsById = new Map(
      sourceInvoice.items.map((item) => [item.id, item]),
    );
    const noteLines: AdjustmentNoteLine[] = [];
    let quantitiesValid = requestedItems.length > 0;
    for (const requested of requestedItems) {
      const source = sourceItemsById.get(requested.sourceInvoiceItemId);
      if (!source) {
        quantitiesValid = false;
        continue;
      }

      const requestedQuantity = Number(requested.quantity);
      if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
        quantitiesValid = false;
        continue;
      }

      const quantity = new Prisma.Decimal(String(requestedQuantity)).toDecimalPlaces(
        4,
        Prisma.Decimal.ROUND_HALF_UP,
      );
      const sourceQuantity = this.decimal(
        source.quantityAmount,
        source.quantity,
      ).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
      if (quantity.greaterThan(sourceQuantity)) {
        quantitiesValid = false;
        continue;
      }

      const sourceUnitPrice = this.decimal(
        source.unitPriceAmount,
        source.unitPrice,
      ).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
      const requestedUnitPrice = Number(
        requested.unitPrice ?? sourceUnitPrice.toNumber(),
      );
      if (
        !Number.isFinite(requestedUnitPrice) ||
        requestedUnitPrice <= 0
      ) {
        quantitiesValid = false;
        continue;
      }
      const unitPrice = new Prisma.Decimal(String(requestedUnitPrice))
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
      if (
        documentCode === 'NC' &&
        unitPrice.greaterThan(sourceUnitPrice)
      ) {
        quantitiesValid = false;
        continue;
      }

      const total = quantity
        .mul(unitPrice)
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

      if (documentCode === 'NC') {
        const previouslyCredited = creditedBySourceItem.get(source.id) ?? {
          quantity: new Prisma.Decimal(0),
          total: new Prisma.Decimal(0),
        };
        const availableQuantity = sourceQuantity
          .sub(previouslyCredited.quantity)
          .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
        const availableAmount = this.decimal(
          source.totalAmount,
          source.total,
        )
          .sub(previouslyCredited.total)
          .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

        if (
          availableQuantity.lessThan(0) ||
          availableAmount.lessThan(0) ||
          quantity.greaterThan(
            availableQuantity.add(new Prisma.Decimal('0.0001')),
          ) ||
          total.greaterThan(availableAmount.add(new Prisma.Decimal('0.01')))
        ) {
          quantitiesValid = false;
          continue;
        }
      }

      const taxRate = new Prisma.Decimal(source.taxRate?.toString() ?? '0').toDecimalPlaces(
        6,
        Prisma.Decimal.ROUND_HALF_UP,
      );
      const taxAmount = total
        .mul(taxRate)
        .div(100)
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

      noteLines.push({
        source,
        quantity,
        unitPrice,
        total,
        taxRate,
        taxAmount,
      });
    }

    const reasonProvided = Boolean(dto.reason?.trim());
    if (!quantitiesValid || !reasonProvided) {
      return this.adjustmentReviewRequired(
        sourceInvoice,
        documentCode === 'NC'
          ? 'A validação automática não aprovou a nota de crédito. Revise as quantidades, o valor indicado, o saldo disponível e o motivo.'
          : 'A validação automática não aprovou a nota de débito. Revise as quantidades, o valor adicional indicado e o motivo.',
        sourceDetailsComplete,
        sourceValuesComplete,
        quantitiesValid,
        reasonProvided,
        documentCode,
      );
    }

    return {
      sourceInvoice,
      noteLines,
      validation: this.adjustmentValidation(
        'VALIDATED',
        documentCode === 'NC'
          ? 'Validação automática concluída. O saldo de crédito foi confirmado e a nota pode ser emitida.'
          : 'Validação automática concluída. Os dados da factura, o valor adicional e os impostos foram confirmados antes da emissão.',
        true,
        sourceDetailsComplete,
        sourceValuesComplete,
        true,
        true,
        documentCode,
      ),
    };
  }

  private adjustmentRecoveryRequired(
    sourceInvoice: AdjustmentSourceInvoice,
    message: string,
    sourceDetailsComplete: boolean,
    sourceValuesComplete: boolean,
    documentCode: AdjustmentDocumentCode,
  ): AdjustmentPreparation {
    return {
      sourceInvoice,
      validation: this.adjustmentValidation(
        'RECOVERY_REQUIRED',
        message,
        false,
        sourceDetailsComplete,
        sourceValuesComplete,
        false,
        false,
        documentCode,
      ),
    };
  }

  private adjustmentReviewRequired(
    sourceInvoice: AdjustmentSourceInvoice,
    message: string,
    sourceDetailsComplete: boolean,
    sourceValuesComplete: boolean,
    quantitiesValid: boolean,
    reasonProvided: boolean,
    documentCode: AdjustmentDocumentCode,
  ): AdjustmentPreparation {
    return {
      sourceInvoice,
      validation: this.adjustmentValidation(
        'REVIEW_REQUIRED',
        message,
        false,
        sourceDetailsComplete,
        sourceValuesComplete,
        quantitiesValid,
        reasonProvided,
        documentCode,
      ),
    };
  }

  private adjustmentValidation(
    status: AdjustmentValidationStatus,
    message: string,
    canCreate: boolean,
    sourceDetailsComplete: boolean,
    sourceValuesComplete: boolean,
    quantitiesValid: boolean,
    reasonProvided: boolean,
    documentCode: AdjustmentDocumentCode,
  ): AdjustmentValidation {
    return {
      status,
      canCreate,
      message,
      checks: [
        { label: 'Factura de origem confirmada', passed: true },
        {
          label: 'Detalhe de artigos e serviços confirmado',
          passed: sourceDetailsComplete,
        },
        {
          label: 'Valores e impostos confirmados',
          passed: sourceValuesComplete,
        },
        {
          label:
            documentCode === 'NC'
              ? 'Quantidades, valores e saldo de crédito confirmados'
              : 'Quantidades e valor adicional confirmados',
          passed: quantitiesValid,
        },
        { label: 'Motivo da rectificação informado', passed: reasonProvided },
      ],
    };
  }

  private hasCompleteAdjustmentLineDetails(
    item: AdjustmentSourceInvoice['items'][number],
  ): boolean {
    if (
      !item.productName?.trim() ||
      !item.unit?.trim() ||
      !item.taxType ||
      !item.taxCode ||
      item.taxRate === null ||
      item.taxAmount === null ||
      !item.electronicOperationType?.trim() ||
      !this.hasRecordedAmount(item.quantityAmount, item.quantity) ||
      !this.hasRecordedAmount(item.unitPriceAmount, item.unitPrice) ||
      !this.hasRecordedAmount(item.totalAmount, item.total)
    ) {
      return false;
    }

    const quantity = this.decimal(item.quantityAmount, item.quantity);
    const unitPrice = this.decimal(item.unitPriceAmount, item.unitPrice);
    const total = this.decimal(item.totalAmount, item.total);
    const taxRate = new Prisma.Decimal(item.taxRate.toString());
    const taxAmount = new Prisma.Decimal(item.taxAmount.toString());

    if (quantity.lessThanOrEqualTo(0) || unitPrice.lessThan(0)) {
      return false;
    }

    if (
      !this.sameMoney(
        quantity.mul(unitPrice).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP),
        total,
      ) ||
      !this.sameMoney(
        total
          .mul(taxRate)
          .div(100)
          .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP),
        taxAmount,
      )
    ) {
      return false;
    }

    return !(
      taxRate.isZero() &&
      (!item.taxExemptionCode?.trim() || !item.taxExemptionReason?.trim())
    );
  }

  private hasConsistentAdjustmentSourceAmounts(
    sourceInvoice: AdjustmentSourceInvoice,
  ): boolean {
    if (
      !this.hasRecordedAmount(sourceInvoice.subtotalAmount, sourceInvoice.subtotal) ||
      !this.hasRecordedAmount(sourceInvoice.ivaAmount, sourceInvoice.iva) ||
      !this.hasRecordedAmount(
        sourceInvoice.withholdingTaxAmount,
        sourceInvoice.withholdingTax,
      ) ||
      !this.hasRecordedAmount(sourceInvoice.totalAmount, sourceInvoice.total)
    ) {
      return false;
    }

    const linesSubtotal = sourceInvoice.items.reduce(
      (sum, item) => sum.add(this.decimal(item.totalAmount, item.total)),
      new Prisma.Decimal(0),
    );
    const linesIva = sourceInvoice.items.reduce(
      (sum, item) =>
        sum.add(new Prisma.Decimal(item.taxAmount?.toString() ?? '0')),
      new Prisma.Decimal(0),
    );
    const subtotal = this.decimal(
      sourceInvoice.subtotalAmount,
      sourceInvoice.subtotal,
    );
    const iva = this.decimal(sourceInvoice.ivaAmount, sourceInvoice.iva);
    const withholding = this.decimal(
      sourceInvoice.withholdingTaxAmount,
      sourceInvoice.withholdingTax,
    );
    const total = this.decimal(sourceInvoice.totalAmount, sourceInvoice.total);

    return (
      this.sameMoney(linesSubtotal, subtotal) &&
      this.sameMoney(linesIva, iva) &&
      this.sameMoney(subtotal.add(iva).sub(withholding), total)
    );
  }

  private hasRecordedAmount(
    exactValue: Prisma.Decimal | null | undefined,
    legacyValue: number | null | undefined,
  ): boolean {
    if (exactValue !== null && exactValue !== undefined) {
      return exactValue.isFinite();
    }

    return typeof legacyValue === 'number' && Number.isFinite(legacyValue);
  }

  private sameMoney(left: Prisma.Decimal, right: Prisma.Decimal): boolean {
    return left
      .sub(right)
      .abs()
      .lessThanOrEqualTo(new Prisma.Decimal('0.01'));
  }

  async convertProForma(tenantId: string, proFormaId: string) {
    const proForma = await this.prisma.invoice.findFirst({
      where: {
        id: proFormaId,
        tenantId,
        documentType: InvoiceDocumentType.PRO_FORMA,
      },
      include: { items: true },
    });

    if (!proForma) {
      throw new NotFoundException('Pro Forma não encontrada.');
    }

    const existing = await this.prisma.invoice.findFirst({
      where: { tenantId, sourceProFormaId: proForma.id },
      include: { client: true, items: true },
    });
    if (existing) {
      return existing;
    }

    return this.createDocument(
      tenantId,
      {
        clientId: proForma.clientId,
        dueDate: proForma.dueDate?.toISOString(),
        notes: proForma.notes ?? undefined,
        items: proForma.items.map((item) => ({
          productId: item.productId ?? undefined,
          productName: item.productName,
          unit: item.unit as CreateInvoiceItemDto['unit'],
          electronicOperationType: item.electronicOperationType ?? undefined,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
      InvoiceDocumentType.NORMAL,
      proForma.id,
    );
  }

  private async createDocument(
    tenantId: string,
    dto: CreateInvoiceDto,
    documentType: InvoiceDocumentType,
    sourceProFormaId?: string,
  ) {
    const fiscalDocumentCode: FiscalDocumentCode =
      documentType === InvoiceDocumentType.PRO_FORMA ? 'PF' : 'FT';
    const tenant =
      await this.prisma.tenant.findUnique({
        where: {
          id: tenantId,
        },

        select: {
          id: true,
          name: true,
          nif: true,
          retentionRate: true,
        },
      });

    if (!tenant) {
      throw new NotFoundException(
        'Empresa não encontrada.',
      );
    }

    const client =
      await this.prisma.client.findFirst({
        where: {
          id: dto.clientId,
          tenantId,
        },
      });

    if (!client) {
      throw new NotFoundException(
        'Cliente não encontrado.',
      );
    }

    if (!Array.isArray(dto.items) || dto.items.length === 0) {
      throw new BadRequestException(
        'A factura deve possuir pelo menos um item.',
      );
    }

    const productIds = [
      ...new Set(
        dto.items
          .map((item) => item.productId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const products = productIds.length
      ? await this.prisma.product.findMany({
          where: { tenantId, id: { in: productIds }, isActive: true },
          select: {
            id: true,
            name: true,
            price: true,
            priceAmount: true,
            unit: true,
            electronicOperationType: true,
          },
        })
      : [];

    if (products.length !== productIds.length) {
      throw new NotFoundException(
        'Um dos produtos n\u00e3o existe, est\u00e1 inactivo ou pertence a outra empresa.',
      );
    }

    const productsById = new Map(products.map((product) => [product.id, product]));
    const normalizedItems = dto.items.map((item) => {
      const product = item.productId ? productsById.get(item.productId) : undefined;
      return {
        productId: product?.id ?? null,
        productName: product?.name ?? item.productName.trim(),
        quantity: item.quantity,
        unitPrice: product
          ? Number(product.priceAmount?.toString() ?? product.price)
          : item.unitPrice,
        unit: product?.unit ?? item.unit ?? 'UN',
        electronicOperationType: product?.electronicOperationType ?? item.electronicOperationType ?? null,
      };
    });

    for (const item of normalizedItems) {
      if (
        !item.productName?.trim() ||
        !Number.isFinite(item.quantity) ||
        item.quantity <= 0 ||
        !Number.isFinite(item.unitPrice) ||
        item.unitPrice <= 0
      ) {
        throw new BadRequestException(
          'Existem itens de factura com dados inválidos.',
        );
      }
    }

    // ==========================================================
    // SUBTOTAL
    // ==========================================================

    // ==========================================================
    // IVA
    //
    // REGIME GERAL:
    //   taxa normal = 14%, apenas depois da classificação da linha.
    //
    // REGIME SIMPLIFICADO:
    //   o imposto não é acrescentado à factura como 14%.
    //   O IVA é apurado mensalmente pelo sistema sobre os
    //   recebimentos efectivos, à taxa de 7%, conforme o
    //   enquadramento fiscal.
    //
    // O cálculo é feito exclusivamente no backend.
    // ==========================================================

    const issuedAt = new Date();
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    const ivaEnrollment = documentType === InvoiceDocumentType.NORMAL
      ? await this.enrollments?.resolve(tenantId, TaxType.IVA, issuedAt)
      : null;
    if (documentType === InvoiceDocumentType.NORMAL && !ivaEnrollment) {
      throw new BadRequestException({
        code: 'IVA_ENROLLMENT_REQUIRED',
        message: 'É necessário um enquadramento IVA vigente na data de emissão da factura.',
        rate: null,
        ratePercent: null,
        iva: null,
        total: null,
        calculationStatus: 'NEEDS_CONFIGURATION',
      });
    }
    const ivaRegime = ivaEnrollment?.regime ?? null;
    if (documentType === InvoiceDocumentType.NORMAL && !ivaRegime) {
      throw new BadRequestException({
        code: 'IVA_ENROLLMENT_UNCONFIRMED',
        message:
          'IVA por apurar: o enquadramento IVA da empresa ainda não foi confirmado.',
        rate: null,
        ratePercent: null,
        iva: null,
        total: null,
        calculationStatus: 'NEEDS_OFFICIAL_CONFIRMATION',
      });
    }
    const vatPolicy = resolveInvoiceVatPolicy(
      documentType === InvoiceDocumentType.NORMAL ? ivaRegime : 'GERAL',
    );
    const hasFiscalLineClassification = normalizedItems.every((item) =>
      Boolean(item.electronicOperationType?.trim()),
    );
    if (
      documentType === InvoiceDocumentType.NORMAL &&
      vatPolicy.requiresLineClassification &&
      !hasFiscalLineClassification
    ) {
      /*
       * Product.ivaRate has a legacy default of 14 and is not evidence that
       * this operation is taxable at the general rate. The persisted AGT
       * operation classification is the minimum factual input we have here.
       */
      throw new BadRequestException({
        code: 'IVA_FISCAL_CLASSIFICATION_REQUIRED',
        message:
          'IVA por apurar: classifique a operação AGT em todas as linhas antes de emitir a factura. Nenhuma taxa de 14% foi assumida.',
        rate: null,
        ratePercent: null,
        iva: null,
        total: null,
        calculationStatus: 'NEEDS_OFFICIAL_CONFIRMATION',
      });
    }
    const ivaRate =
      documentType === InvoiceDocumentType.PRO_FORMA
        ? 0
        : Number(vatPolicy.invoiceRate);

    // ==========================================================
    // RETENÇÃO
    //
    // IMPORTANTE:
    //
    // O regime Geral, por si só, NÃO significa que toda factura
    // tenha retenção.
    //
    // A retenção só será aplicada quando existir uma taxa
    // explicitamente configurada na empresa.
    //
    // Assim evitamos aplicar automaticamente 6,5% a qualquer
    // venda de produto/serviço sem que a operação esteja
    // configurada para retenção.
    // ==========================================================

    const configuredRetentionRate =
      this.number(
        tenant.retentionRate,
      );

    const retentionRate =
      documentType === InvoiceDocumentType.NORMAL &&
      configuredRetentionRate > 0
        ? configuredRetentionRate / 100
        : 0;

    const calculation = calculateInvoiceAmounts(
      normalizedItems,
      ivaRate,
      retentionRate,
    );

    if (calculation.subtotal.lessThanOrEqualTo(0)) {
      throw new BadRequestException(
        'O subtotal da factura deve ser maior que zero.',
      );
    }

    const subtotal = calculation.subtotal.toNumber();
    const iva = calculation.iva.toNumber();
    const withholdingTax = calculation.withholdingTax.toNumber();
    const total = calculation.total.toNumber();

    // ==========================================================
    // NÚMERO DA FACTURA
    // ==========================================================

    const year = Number(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Luanda',
        year: 'numeric',
      }).format(issuedAt),
    );
    const fiscalSeries = this.fiscalSeriesFor(fiscalDocumentCode, year);
    const simplifiedInvoice =
      documentType === InvoiceDocumentType.NORMAL &&
      vatPolicy.requiredInvoiceMention === SIMPLIFIED_IVA_INVOICE_MENTION;
    const requestedNotes = dto.notes?.trim() || null;
    const documentNotes = simplifiedInvoice
      ? [SIMPLIFIED_IVA_INVOICE_MENTION, requestedNotes]
          .filter(
            (value, index, values): value is string =>
              Boolean(value) && values.indexOf(value) === index,
          )
          .join('\n')
      : requestedNotes;

    const data = {
      tenantId,

      clientId:
        dto.clientId,

      subtotal,

      subtotalAmount:
        calculation.subtotal,

      iva,

      ivaAmount:
        calculation.iva,

      withholdingTax,

      withholdingTaxAmount:
        calculation.withholdingTax,

      total,

      totalAmount:
        calculation.total,

      taxRuleVersion:
        vatPolicy.ruleVersion,

      taxCalculationStatus:
        documentType === InvoiceDocumentType.PRO_FORMA
          ? 'PREVIEW_NON_FISCAL'
          : vatPolicy.calculationStatus,

      documentType,

      fiscalDocumentType:
        documentType === InvoiceDocumentType.PRO_FORMA
          ? null
          : fiscalDocumentCode,

      fiscalSeries,

      fiscalYear:
        year,

      sourceProFormaId:
        sourceProFormaId ??
        null,

      dueDate,

      issuedAt,

      createdAt: issuedAt,

      notes: documentNotes || null,

      status:
        'PENDING' as const,

      items: {
        create:
          normalizedItems.map(
            (item, index) => ({
              productId:
                item.productId,

              productName:
                item.productName.trim(),

              quantity:
                calculation.lines[index].quantity.toNumber(),

              quantityAmount:
                calculation.lines[index].quantity,

              unitPrice:
                calculation.lines[index].unitPrice.toNumber(),

              unitPriceAmount:
                calculation.lines[index].unitPrice,

              total:
                calculation.lines[index].total.toNumber(),

              totalAmount:
                calculation.lines[index].total,

              unit:
                item.unit,

              electronicOperationType:
                item.electronicOperationType,

              taxType:
                documentType === InvoiceDocumentType.NORMAL ? 'IVA' : null,

              taxCode:
                documentType !== InvoiceDocumentType.NORMAL
                  ? null
                  : simplifiedInvoice
                    ? SIMPLIFIED_IVA_SAFT_TAX_CODE
                    : 'NOR',

              taxRate:
                documentType === InvoiceDocumentType.NORMAL
                  ? new Prisma.Decimal(String(ivaRate)).mul(100)
                  : null,

              taxAmount:
                documentType === InvoiceDocumentType.NORMAL
                  ? calculation.lines[index].total
                      .mul(new Prisma.Decimal(String(ivaRate)))
                      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
                  : null,

              taxExemptionCode:
                simplifiedInvoice
                  ? SIMPLIFIED_IVA_SAFT_EXEMPTION_CODE
                  : null,

              taxExemptionReason:
                simplifiedInvoice
                  ? SIMPLIFIED_IVA_INVOICE_MENTION
                  : null,
            }),
          ),
      },
    };

    // ==========================================================
    // CRIAR FACTURA
    // ==========================================================

    try {
      const invoice = await this.prisma.$transaction(
        async (tx) => {
          const lockKey = `${tenantId}:${year}`;

          await tx.$queryRaw`
            SELECT pg_advisory_xact_lock(
              hashtextextended(${lockKey}, 0)
            )::text AS lock
          `;

          const fiscalIdentity = await this.getNextFiscalDocumentIdentity(
            tx,
            tenantId,
            year,
            fiscalDocumentCode,
          );

          let signature:
            | {
                fiscalHash: string;
                fiscalHashControl: string;
                signatureKeyVersion: number;
                previousFiscalHash: string | null;
              }
            | Record<string, never> = {};

          if (documentType === InvoiceDocumentType.NORMAL) {
            if (!this.fiscalSignatureService) {
              throw new ServiceUnavailableException({
                code: 'FISCAL_SIGNATURE_NOT_CONFIGURED',
                message: 'O serviço de assinatura fiscal não está disponível.',
              });
            }
            const previous = await tx.invoice.findFirst({
              where: {
                tenantId,
                fiscalDocumentType: fiscalDocumentCode,
                fiscalSeries,
                fiscalYear: year,
              },
              orderBy: { fiscalSequence: 'desc' },
              select: { fiscalHash: true },
            });
            if (previous && !previous.fiscalHash) {
              throw new ConflictException({
                code: 'LEGACY_UNSIGNED_DOCUMENT',
                message: 'A série contém um documento anterior sem assinatura fiscal persistida. A emissão foi bloqueada para não quebrar a cadeia.',
              });
            }
            const signed = this.fiscalSignatureService.sign({
              invoiceDate: issuedAt,
              systemEntryDate: issuedAt,
              invoiceNo: fiscalIdentity.invoiceNumber,
              grossTotal: calculation.total.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP).toFixed(2),
              previousHash: previous?.fiscalHash ?? null,
            });
            signature = {
              fiscalHash: signed.hash,
              fiscalHashControl: signed.hashControl,
              signatureKeyVersion: signed.keyVersion,
              previousFiscalHash: previous?.fiscalHash ?? null,
            };
          }

          return tx.invoice.create({
            data: {
              ...data,
              invoiceNumber: fiscalIdentity.invoiceNumber,
              fiscalSeries: fiscalIdentity.fiscalSeries,
              fiscalSequence: fiscalIdentity.fiscalSequence,
              ...signature,
            },

            include: {
              client: true,
              items: true,
            },
          });
        },
      );

      if (documentType === InvoiceDocumentType.NORMAL) {
        await this.syncFiscalObligations(tenantId);
      }

      return invoice;
    } catch (error: unknown) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' && sourceProFormaId
      ) {
        const existing = await this.prisma.invoice.findFirst({
          where: { tenantId, sourceProFormaId },
          include: { client: true, items: true },
        });
        if (existing) {
          return existing;
        }
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Não foi possível gerar uma numeração única para a factura. Tente novamente.',
        );
      }

      throw error;
    }
  }

  // ============================================================
  // SINCRONIZAR OBRIGAÇÕES
  // ============================================================

  private async syncFiscalObligations(
    tenantId: string,
  ) {
    try {
      await this.fiscalEngineService.syncTenant(tenantId);
      const result =
        await this.obligationsService.syncCompany(
          tenantId,
        );

      this.logger.log(
        `Obrigações fiscais sincronizadas após alteração de factura. Tenant: ${tenantId}`,
      );

      return result;
    } catch (error) {
      /*
       * A factura já foi criada.
       *
       * Não apagamos a factura se a sincronização fiscal falhar.
       *
       * O calendário/obrigações poderá ser sincronizado
       * novamente posteriormente.
       */

      this.logger.error(
        `Falha ao sincronizar obrigações após factura do tenant ${tenantId}.`,
        error instanceof Error
          ? error.stack
          : String(error),
      );

      return null;
    }
  }

  // ============================================================
  // PRÓXIMO NÚMERO
  // ============================================================

  private fiscalSeriesFor(
    documentCode: FiscalDocumentCode,
    year: number,
  ): string {
    // The document code is unique per type and the year gives every annual
    // series its own identifier, so a sequence may restart without reusing an
    // InvoiceNo from a prior year.
    return `${documentCode}${year}`;
  }

  private async getNextFiscalDocumentIdentity(
    tx: Prisma.TransactionClient,
    tenantId: string,
    year: number,
    documentCode: FiscalDocumentCode,
  ): Promise<FiscalDocumentIdentity> {
    const fiscalSeries = this.fiscalSeriesFor(documentCode, year);
    const invoices = await tx.invoice.findMany({
      where: {
        tenantId,
        fiscalSeries,
        fiscalYear: year,
      },
      select: {
        fiscalSequence: true,
        invoiceNumber: true,
      },
    });

    let highest = 0;

    for (const invoice of invoices) {
      const persistedSequence = invoice.fiscalSequence;
      const numberMatch = new RegExp(
        `^${documentCode} ${fiscalSeries}/(\\d+)$`,
      ).exec(invoice.invoiceNumber);
      const sequence = Number.isInteger(persistedSequence)
        ? persistedSequence
        : Number(numberMatch?.[1]);

      if (Number.isInteger(sequence) && sequence > highest) {
        highest = sequence;
      }
    }

    const fiscalSequence = highest + 1;
    return {
      fiscalSeries,
      fiscalSequence,
      invoiceNumber: `${documentCode} ${fiscalSeries}/${String(
        fiscalSequence,
      ).padStart(5, '0')}`,
    };
  }

  // ============================================================
  // LISTAR
  // ============================================================

  private documentFilter(
    documentType: InvoiceDocumentType,
    fiscalDocumentType?: 'FT' | 'NC' | 'ND',
  ): Prisma.InvoiceWhereInput {
    if (fiscalDocumentType) {
      return { fiscalDocumentType };
    }

    if (documentType === InvoiceDocumentType.PRO_FORMA) {
      return { fiscalDocumentType: null };
    }

    return {
      OR: [
        { fiscalDocumentType: 'FT' },
        { fiscalDocumentType: null },
      ],
    };
  }

  async findAll(
    tenantId: string,
    documentType: InvoiceDocumentType = InvoiceDocumentType.NORMAL,
    fiscalDocumentType?: 'FT' | 'NC' | 'ND',
  ) {
    return this.prisma.invoice.findMany({
      where: {
        tenantId,
        documentType,
        ...this.documentFilter(documentType, fiscalDocumentType),
      },

      include: {
        client: true,
        items: true,
        convertedInvoice: {
          select: {
            id: true,
            invoiceNumber: true,
          },
        },
      },

      orderBy: {
        createdAt:
          'desc',
      },
    });
  }

  async findPage(tenantId: string, query: InvoiceQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();
    const documentType = query.documentType ?? InvoiceDocumentType.NORMAL;
    const documentFilter = this.documentFilter(
      documentType,
      query.fiscalDocumentType,
    );
    const where: Prisma.InvoiceWhereInput = {
      tenantId,
      documentType,
      ...(query.status ? { status: query.status } : {}),
      AND: [
        documentFilter,
        ...(search
          ? [{
              OR: [
              { invoiceNumber: { contains: search, mode: 'insensitive' as const } },
              { client: { name: { contains: search, mode: 'insensitive' as const } } },
              { client: { nif: { contains: search, mode: 'insensitive' as const } } },
              ],
            }]
          : []),
      ],
    };
    const summaryWhere: Prisma.InvoiceWhereInput = {
      tenantId,
      documentType,
      AND: [documentFilter],
    };
    const orderBy = {
      [query.sortBy ?? 'issuedAt']: query.sortDirection ?? 'desc',
    } as Prisma.InvoiceOrderByWithRelationInput;

    const [total, invoices, pending, paid, cancelled, amounts] =
      await this.prisma.$transaction([
        this.prisma.invoice.count({ where }),
        this.prisma.invoice.findMany({
          where,
          include: { client: true, items: true },
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        this.prisma.invoice.count({
          where: {
            ...summaryWhere,
            status: 'PENDING',
          },
        }),
        this.prisma.invoice.count({
          where: {
            ...summaryWhere,
            status: 'PAID',
          },
        }),
        this.prisma.invoice.count({
          where: {
            ...summaryWhere,
            status: 'CANCELLED',
          },
        }),
        this.prisma.invoice.aggregate({
          where: {
            ...summaryWhere,
            status: { not: 'CANCELLED' },
          },
          _sum: {
            total: true,
            iva: true,
            totalAmount: true,
            ivaAmount: true,
          },
        }),
      ]);

    const totalInvoicedAmount = this.decimal(
      amounts._sum.totalAmount,
      amounts._sum.total,
    ).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const ivaInvoicedAmount = this.decimal(
      amounts._sum.ivaAmount,
      amounts._sum.iva,
    ).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    return {
      data: invoices,
      summary: {
        total: pending + paid + cancelled,
        pending,
        paid,
        cancelled,
        totalInvoiced: totalInvoicedAmount.toNumber(),
        totalInvoicedAmount: totalInvoicedAmount.toFixed(2),
        ivaInvoiced: ivaInvoicedAmount.toNumber(),
        ivaInvoicedAmount: ivaInvoicedAmount.toFixed(2),
      },
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  // ============================================================
  // BUSCAR UMA
  // ============================================================

  async findOne(
    tenantId: string,
    id: string,
  ) {
    const invoice =
      await this.prisma.invoice.findFirst({
        where: {
          id,
          tenantId,
        },

        include: {
          client: true,
          items: { include: { product: true } },
          convertedInvoice: {
            select: {
              id: true,
              invoiceNumber: true,
            },
          },
        },
      });

    if (!invoice) {
      throw new NotFoundException(
        'Factura não encontrada.',
      );
    }

    const rectifiedInvoice = invoice.rectifiesInvoiceId
      ? await this.prisma.invoice.findFirst({
          where: {
            id: invoice.rectifiesInvoiceId,
            tenantId,
          },
          select: {
            id: true,
            invoiceNumber: true,
            fiscalDocumentType: true,
          },
        })
      : null;

    const rectificationNotes =
      invoice.documentType === InvoiceDocumentType.NORMAL &&
      (invoice.fiscalDocumentType === 'FT' || invoice.fiscalDocumentType === null)
        ? await this.prisma.invoice.findMany({
            where: {
              tenantId,
              rectifiesInvoiceId: invoice.id,
              fiscalDocumentType: { in: ['NC', 'ND'] },
            },
            select: {
              id: true,
              invoiceNumber: true,
              fiscalDocumentType: true,
              status: true,
              total: true,
              totalAmount: true,
              issuedAt: true,
              notes: true,
              adjustmentValidationStatus: true,
              adjustmentValidatedAt: true,
            },
            orderBy: { issuedAt: 'desc' },
          })
        : [];

    return {
      ...invoice,
      rectifiedInvoice,
      rectificationNotes,
    };
  }

  // ============================================================
  // MARCAR COMO PAGA
  // ============================================================

  async markAsPaid(
    tenantId: string,
    id: string,
    actorUserId?: string,
  ) {
    const invoice =
      await this.prisma.invoice.findFirst({
        where: {
          id,
          tenantId,
        },
      });

    if (!invoice) {
      throw new NotFoundException(
        'Factura não encontrada.',
      );
    }

    if (invoice.documentType === InvoiceDocumentType.PRO_FORMA) {
      throw new BadRequestException(
        'Uma Pro Forma nao pode ser marcada como paga. Converta-a primeiro em factura.',
      );
    }

    if (
      invoice.fiscalDocumentType === 'NC' ||
      invoice.fiscalDocumentType === 'ND'
    ) {
      throw new BadRequestException(
        'O pagamento desta nota deve ser registado no fluxo financeiro apropriado.',
      );
    }

    if (
      invoice.status ===
      'CANCELLED'
    ) {
      throw new BadRequestException(
        'Uma factura cancelada não pode ser marcada como paga.',
      );
    }

    if (
      invoice.status ===
      'PAID'
    ) {
      return this.findOne(
        tenantId,
        id,
      );
    }

    const transition = await this.prisma.$transaction(async (tx) => {
      const result = await tx.invoice.updateMany({
        where: {
          id: invoice.id,
          tenantId,
          status: 'PENDING',
        },

        data: {
          status: 'PAID',
        },
      });

      if (result.count > 0) {
        await tx.auditLog.create({
          data: {
            tenantId,
            userId: actorUserId ?? null,
            action: 'INVOICE_MARKED_PAID',
            entity: 'Invoice',
            entityId: invoice.id,
            oldData: { status: 'PENDING' },
            newData: { status: 'PAID' },
          },
        });
      }

      return result;
    });

    if (transition.count === 0) {
      const current = await this.findOne(
        tenantId,
        id,
      );

      if (current.status === 'CANCELLED') {
        throw new BadRequestException(
          'Uma factura cancelada não pode ser marcada como paga.',
        );
      }

      return current;
    }

    /*
     * A factura agora está PAID.
     *
     * Sincronizamos novamente para manter o estado fiscal
     * actualizado.
     */
    await this.syncFiscalObligations(
      tenantId,
    );

    return this.findOne(
      tenantId,
      id,
    );
  }

  // ============================================================
  // CANCELAR
  // ============================================================

  async cancel(
    tenantId: string,
    id: string,
    actorUserId?: string,
  ) {
    const invoice =
      await this.prisma.invoice.findFirst({
        where: {
          id,
          tenantId,
        },
      });

    if (!invoice) {
      throw new NotFoundException(
        'Factura não encontrada.',
      );
    }

    if (
      invoice.status ===
      'PAID'
    ) {
      throw new BadRequestException(
        'Uma factura paga não pode ser cancelada directamente.',
      );
    }

    if (
      invoice.status ===
      'CANCELLED'
    ) {
      return this.findOne(
        tenantId,
        id,
      );
    }

    const transition = await this.prisma.$transaction(async (tx) => {
      const adjustmentScopeId = invoice.rectifiesInvoiceId ?? invoice.id;
      const lockKey = `${tenantId}:adjustment:${adjustmentScopeId}`;
      await tx.$queryRaw`
        SELECT pg_advisory_xact_lock(
          hashtextextended(${lockKey}, 0)
        )::text AS lock
      `;

      if (
        invoice.documentType === InvoiceDocumentType.NORMAL &&
        (invoice.fiscalDocumentType === 'FT' ||
          invoice.fiscalDocumentType === null)
      ) {
        const activeAdjustments = await tx.invoice.count({
          where: {
            tenantId,
            rectifiesInvoiceId: invoice.id,
            fiscalDocumentType: { in: ['NC', 'ND'] },
            status: { not: 'CANCELLED' },
          },
        });
        if (activeAdjustments > 0) {
          throw new BadRequestException(
            'Esta factura possui notas activas. Cancele as respectivas notas antes de cancelar a factura de origem.',
          );
        }
      }

      const result = await tx.invoice.updateMany({
        where: {
          id: invoice.id,
          tenantId,
          status: 'PENDING',
        },

        data: {
          status: 'CANCELLED',
        },
      });

      if (result.count > 0) {
        await tx.auditLog.create({
          data: {
            tenantId,
            userId: actorUserId ?? null,
            action: 'INVOICE_CANCELLED',
            entity: 'Invoice',
            entityId: invoice.id,
            oldData: { status: 'PENDING' },
            newData: { status: 'CANCELLED' },
          },
        });
      }

      return result;
    });

    if (transition.count === 0) {
      const current = await this.findOne(
        tenantId,
        id,
      );

      if (current.status === 'PAID') {
        throw new BadRequestException(
          'Uma factura paga não pode ser cancelada directamente.',
        );
      }

      return current;
    }

    // ==========================================================
    // RECALCULAR OBRIGAÇÕES
    //
    // A factura cancelada é excluída pelo ObligationsService.
    // ==========================================================

    await this.syncFiscalObligations(
      tenantId,
    );

    return this.findOne(
      tenantId,
      id,
    );
  }

  // ============================================================
  // ESTATÍSTICAS
  // ============================================================

  async getDashboardStats(
    tenantId: string,
  ) {
    const invoices =
      await this.prisma.invoice.findMany({
        where: {
          tenantId,
          documentType: InvoiceDocumentType.NORMAL,
        },

        select: {
          id: true,
          status: true,
          fiscalDocumentType: true,
          rectifiesInvoiceId: true,
          total: true,
          totalAmount: true,
        },
      });

    const commercialInvoices = invoices.filter(
      (invoice) =>
        invoice.fiscalDocumentType === 'FT' ||
        invoice.fiscalDocumentType === null,
    );
    const totalInvoices = commercialInvoices.length;

    const paid =
      commercialInvoices.filter(
        (invoice) =>
          invoice.status ===
          'PAID',
      );

    const pending =
      commercialInvoices.filter(
        (invoice) =>
          invoice.status ===
          'PENDING',
      );

    const cancelled =
      commercialInvoices.filter(
        (invoice) =>
          invoice.status ===
          'CANCELLED',
      );

    const sumDocuments = (
      entries: typeof invoices,
    ) => entries.reduce(
      (sum, invoice) => {
        const sign = invoice.fiscalDocumentType === 'NC' ? -1 : 1;
        return sum.add(
          this.decimal(invoice.totalAmount, invoice.total).mul(sign),
        );
      },
      new Prisma.Decimal(0),
    ).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    // Uma nota não é um pagamento por si só, mas altera o saldo da factura
    // que rectifica. Crédito sobre factura paga reduz o recebido; débito de
    // factura paga passa a ser valor pendente. Para facturas pendentes, as
    // duas notas ajustam directamente o valor ainda por liquidar.
    const sourceInvoicesById = new Map(
      commercialInvoices.map((invoice) => [invoice.id, invoice]),
    );
    let revenueReceivedAmount = sumDocuments(paid);
    let revenuePendingAmount = sumDocuments(pending);
    for (const adjustment of invoices) {
      if (
        adjustment.status === 'CANCELLED' ||
        (adjustment.fiscalDocumentType !== 'NC' &&
          adjustment.fiscalDocumentType !== 'ND')
      ) {
        continue;
      }

      const source = adjustment.rectifiesInvoiceId
        ? sourceInvoicesById.get(adjustment.rectifiesInvoiceId)
        : null;
      if (!source || source.status === 'CANCELLED') continue;

      const adjustmentAmount = this.decimal(
        adjustment.totalAmount,
        adjustment.total,
      );
      const signedAdjustment =
        adjustment.fiscalDocumentType === 'NC'
          ? adjustmentAmount.negated()
          : adjustmentAmount;

      if (
        source.status === 'PAID' &&
        adjustment.fiscalDocumentType === 'NC'
      ) {
        revenueReceivedAmount = revenueReceivedAmount.add(signedAdjustment);
      } else {
        revenuePendingAmount = revenuePendingAmount.add(signedAdjustment);
      }
    }
    revenueReceivedAmount = revenueReceivedAmount.toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP,
    );
    revenuePendingAmount = revenuePendingAmount.toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP,
    );
    const totalInvoicedAmount = sumDocuments(
      invoices.filter((invoice) => invoice.status !== 'CANCELLED'),
    );

    return {
      totalInvoices,

      paidInvoices:
        paid.length,

      pendingInvoices:
        pending.length,

      cancelledInvoices:
        cancelled.length,

      revenueReceived:
        revenueReceivedAmount.toNumber(),

      revenueReceivedAmount:
        revenueReceivedAmount.toFixed(2),

      revenuePending:
        revenuePendingAmount.toNumber(),

      revenuePendingAmount:
        revenuePendingAmount.toFixed(2),

      totalInvoiced:
        totalInvoicedAmount.toNumber(),

      totalInvoicedAmount:
        totalInvoicedAmount.toFixed(2),
    };
  }

  // ============================================================
  // PDF
  // ============================================================

  async generatePdf(
    tenantId: string,
    id: string,
    res: Response,
  ) {
    const invoice =
      await this.prisma.invoice.findFirst({
        where: {
          id,
          tenantId,
        },

        include: {
          client: true,
          items: {
            include: {
              product: true,
            },
          },
          tenant: true,
        },
      });

    if (!invoice) {
      throw new NotFoundException(
        'Factura não encontrada.',
      );
    }

    const rectifiedInvoice = invoice.rectifiesInvoiceId
      ? await this.prisma.invoice.findFirst({
          where: {
            id: invoice.rectifiesInvoiceId,
            tenantId,
          },
          select: { invoiceNumber: true },
        })
      : null;

    const doc = new PDFDocument({ size: 'A4', margin: 38, bufferPages: true });

    res.setHeader(
      'Content-Type',
      'application/pdf',
    );

    res.setHeader(
      'Content-Disposition',
      `inline; filename=${invoice.invoiceNumber}.pdf`,
    );

    doc.pipe(res);

    renderInvoicePdf(doc, {
      ...invoice,
      rectifiedInvoiceNumber: rectifiedInvoice?.invoiceNumber ?? null,
    });

    doc.end();
  }

  // ============================================================
  // NUMBER
  // ============================================================

  private number(
    value: any,
  ): number {
    const result =
      Number(value);

    return Number.isFinite(
      result,
    )
      ? result
      : 0;
  }

  private decimal(
    exactValue: Prisma.Decimal | null | undefined,
    legacyValue: number | null | undefined,
  ): Prisma.Decimal {
    return new Prisma.Decimal(
      exactValue?.toString() ?? String(this.number(legacyValue)),
    );
  }

  // ============================================================
  // ROUND
  // ============================================================

  private round(
    value: number,
  ): number {
    return (
      Math.round(
        (
          value +
          Number.EPSILON
        ) *
          100,
      ) / 100
    );
  }

  // ============================================================
  // FORMATAÇÃO DE DINHEIRO
  // ============================================================

  private formatMoney(
    value: any,
  ): string {
    return this.number(
      value,
    ).toLocaleString(
      'pt-AO',
      {
        minimumFractionDigits:
          2,

        maximumFractionDigits:
          2,
      },
    );
  }
}
