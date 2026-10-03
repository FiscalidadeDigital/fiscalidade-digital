import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AgtClientService } from './agt-client.service';
import { readAgtEinvoiceConfig, requireAgtEinvoiceConfig, type AgtEinvoiceConfig } from './agt-einvoice.config';
import { AgtJwsService } from './agt-jws.service';
import { RequestElectronicSeriesDto } from './dto/request-series.dto';
import {
  AGT_EINVOICE_SCHEMA_VERSION,
  AgtInvoiceResponse,
  AgtRegisterResponse,
  AgtSeriesResponse,
  AgtStatusResponse,
  PreflightIssue,
} from './electronic-invoicing.types';

@Injectable()
export class ElectronicInvoicingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly client: AgtClientService,
    private readonly jws: AgtJwsService,
  ) {}

  readiness() {
    const config = readAgtEinvoiceConfig();
    return {
      certificationStatus: 'NOT_CERTIFIED' as const,
      environment: config?.environment ?? process.env.AGT_EINVOICE_ENVIRONMENT ?? 'homologation',
      configured: Boolean(config),
      transmissionEnabled: Boolean(config) && process.env.AGT_EINVOICE_TRANSMISSION_ENABLED === 'true',
      schemaVersion: AGT_EINVOICE_SCHEMA_VERSION,
    };
  }

  async list(tenantId: string) {
    return this.prisma.electronicInvoiceSubmission.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, invoiceId: true, submissionUuid: true, agtDocumentNo: true,
        requestId: true, environment: true, status: true, attempt: true,
        submittedAt: true, lastCheckedAt: true, agtErrors: true,
        agtErrorHistory: true, updatedAt: true,
      },
    });
  }

  async listSeries(tenantId: string) {
    return this.prisma.electronicInvoiceSeries.findMany({
      where: { tenantId },
      orderBy: [{ seriesYear: 'desc' }, { createdAt: 'desc' }],
    });
  }

  private async source(tenantId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId, documentType: 'NORMAL' },
      include: { tenant: true, client: true, items: { include: { product: true } } },
    });
    if (!invoice) throw new NotFoundException('Factura não encontrada.');
    return invoice;
  }

  private softwareInfo(config: AgtEinvoiceConfig) {
    return {
      softwareInfoDetail: config.software,
      jwsSoftwareSignature: this.jws.sign(
        config.software as unknown as Record<string, unknown>,
        config.privateKey,
      ),
    };
  }

  private requestEnvelope(config: AgtEinvoiceConfig, nif: string) {
    return {
      schemaVersion: AGT_EINVOICE_SCHEMA_VERSION,
      submissionUUID: randomUUID(),
      taxRegistrationNumber: nif,
      submissionTimeStamp: new Date().toISOString(),
      softwareInfo: this.softwareInfo(config),
    };
  }

  async preflight(tenantId: string, invoiceId: string) {
    const invoice = await this.source(tenantId, invoiceId);
    const config = readAgtEinvoiceConfig();
    const issues: PreflightIssue[] = [];
    if (!invoice.tenant.name || !invoice.tenant.nif || !invoice.tenant.address || !invoice.tenant.city) {
      issues.push({ code: 'COMPANY_DATA_MISSING', category: 'DATA', message: 'Nome, NIF, morada e cidade do emissor são obrigatórios.' });
    }
    if (!invoice.client.name || !invoice.client.nif || !invoice.client.country) {
      issues.push({ code: 'CUSTOMER_DATA_MISSING', category: 'DATA', message: 'Nome, NIF e país do cliente são obrigatórios.' });
    }
    if (!invoice.fiscalDocumentType || !invoice.fiscalYear || !invoice.fiscalSequence || !invoice.fiscalHash) {
      issues.push({ code: 'DOCUMENT_DATA_MISSING', category: 'DATA', message: 'O documento fiscal não possui identificação ou assinatura persistida.' });
    }
    if (invoice.items.some((line) => !line.taxType || !line.taxCode || line.taxRate == null || line.taxAmount == null)) {
      issues.push({ code: 'TAX_METADATA_MISSING', category: 'DATA', message: 'Existem linhas sem snapshot fiscal completo.' });
    }
    if (invoice.items.some((line) => (line.taxCode === 'ISE' || line.taxType === 'NS') && !line.taxExemptionCode)) {
      issues.push({ code: 'TAX_EXEMPTION_MISSING', category: 'DATA', message: 'Existem linhas isentas ou não sujeitas sem código oficial de isenção.' });
    }
    if (invoice.items.some((line) => !line.electronicOperationType)) {
      issues.push({ code: 'OPERATION_TYPE_MISSING', category: 'DATA', message: 'Classifique o tipo de operação AGT em todas as linhas.' });
    }
    if (!config) {
      issues.push({ code: 'AGT_CONFIGURATION_PENDING', category: 'CONFIGURATION', message: 'Configuração oficial AGT pendente.' });
    }
    const environment = config?.environment ?? 'homologation';
    const series = invoice.fiscalDocumentType && invoice.fiscalYear
      ? await this.prisma.electronicInvoiceSeries.findFirst({
          where: { tenantId, documentType: invoice.fiscalDocumentType, seriesYear: invoice.fiscalYear, environment },
        })
      : null;
    if (!series) {
      issues.push({ code: 'AGT_SERIES_MISSING', category: 'OFFICIAL_DEPENDENCY', message: 'A factura não possui série electrónica atribuída pela AGT.' });
    }
    issues.push({ code: 'AGT_SOFTWARE_NOT_CERTIFIED', category: 'OFFICIAL_DEPENDENCY', message: 'A certificação oficial do software está pendente.' });
    const blockingIssues = issues.filter((issue) =>
      issue.code !== 'AGT_SOFTWARE_NOT_CERTIFIED' || environment === 'production',
    );
    return {
      ready: blockingIssues.length === 0,
      certificationStatus: 'NOT_CERTIFIED' as const,
      homologationOnly: true,
      issues,
      invoice,
      series,
    };
  }

  private document(invoice: any, documentNo: string) {
    const decimal = (exact: unknown, legacy: unknown) =>
      new Prisma.Decimal(String(exact ?? legacy)).toDecimalPlaces(10).toNumber();
    return {
      documentNo,
      documentStatus: 'N',
      documentDate: invoice.issuedAt.toISOString().slice(0, 10),
      documentType: invoice.fiscalDocumentType,
      systemEntryDate: invoice.createdAt.toISOString(),
      customerTaxID: invoice.client.nif,
      customerCountry: invoice.client.country,
      companyName: invoice.client.name,
      lines: invoice.items.map((line: any, index: number) => ({
        lineNumber: index + 1,
        operationType: line.electronicOperationType,
        productCode: line.product?.code || `LINE-${line.id}`,
        productDescription: line.productName,
        quantity: decimal(line.quantityAmount?.toString(), line.quantity),
        unitOfMeasure: line.unit,
        unitPriceBase: decimal(line.unitPriceAmount?.toString(), line.unitPrice),
        unitPrice: decimal(line.unitPriceAmount?.toString(), line.unitPrice),
        creditAmount: decimal(line.totalAmount?.toString(), line.total),
        settlementAmount: 0,
        taxes: [{
          taxType: line.taxType,
          taxCountryRegion: 'AO',
          taxCode: line.taxCode,
          taxPercentage: Number(line.taxRate),
          taxContribution: decimal(line.taxAmount?.toString(), line.taxAmount),
          ...(line.taxExemptionCode ? { taxExemptionCode: line.taxExemptionCode } : {}),
          ...(line.taxExemptionReason ? { taxExemptionReason: line.taxExemptionReason } : {}),
        }],
      })),
      documentTotals: {
        taxPayable: decimal(invoice.ivaAmount?.toString(), invoice.iva),
        netTotal: decimal(invoice.subtotalAmount?.toString(), invoice.subtotal),
        grossTotal: decimal(invoice.totalAmount?.toString(), invoice.total),
      },
    };
  }

  async submit(tenantId: string, invoiceId: string) {
    const config = requireAgtEinvoiceConfig();
    if (config.environment === 'production') {
      throw new BadRequestException({ code: 'AGT_NOT_CERTIFIED', message: 'Transmissão de produção bloqueada enquanto a certificação oficial estiver pendente.' });
    }
    if (process.env.AGT_EINVOICE_TRANSMISSION_ENABLED !== 'true') {
      throw new BadRequestException({ code: 'AGT_TRANSMISSION_DISABLED', message: 'Transmissão AGT desactivada.' });
    }
    const check = await this.preflight(tenantId, invoiceId);
    if (!check.ready || !check.series) {
      throw new BadRequestException({ code: 'AGT_PREFLIGHT_FAILED', issues: check.issues });
    }
    const submission = await this.prisma.electronicInvoiceSubmission.upsert({
      where: { invoiceId_environment: { invoiceId, environment: config.environment } }, update: {},
      create: { tenantId, invoiceId, submissionUuid: randomUUID(), environment: config.environment, status: 'READY' },
    });
    if (submission.requestId) return submission;
    if (submission.status === 'SUBMITTING') {
      throw new BadRequestException({ code: 'AGT_SUBMISSION_IN_PROGRESS', message: 'A submissão já está em curso.' });
    }
    const documentNo = submission.agtDocumentNo ??
      `${check.invoice.fiscalDocumentType} ${check.series.seriesCode}/${check.invoice.fiscalSequence}`;
    const document = this.document(check.invoice, documentNo);
    const signaturePayload = {
      documentNo: document.documentNo,
      taxRegistrationNumber: check.invoice.tenant.nif,
      documentType: document.documentType,
      documentDate: document.documentDate,
      customerTaxID: document.customerTaxID,
      customerCountry: document.customerCountry,
      companyName: document.companyName,
      documentTotals: document.documentTotals,
    };
    const payload = {
      schemaVersion: AGT_EINVOICE_SCHEMA_VERSION,
      submissionUUID: submission.submissionUuid,
      taxRegistrationNumber: check.invoice.tenant.nif,
      submissionTimeStamp: new Date().toISOString(),
      softwareInfo: this.softwareInfo(config),
      numberOfEntries: 1,
      documents: [{ ...document, jwsDocumentSignature: this.jws.sign(signaturePayload, config.privateKey) }],
    };
    await this.prisma.electronicInvoiceSubmission.update({
      where: { id: submission.id },
      data: { status: 'SUBMITTING', attempt: { increment: 1 }, agtDocumentNo: documentNo },
    });
    try {
      const response = await this.client.post<AgtRegisterResponse>(config, 'registarFactura', payload);
      if (!response.data.requestID) {
        throw new BadRequestException({ code: 'AGT_REQUEST_ID_MISSING', message: 'A resposta AGT não contém requestID.' });
      }
      return this.prisma.electronicInvoiceSubmission.update({
        where: { id: submission.id },
        data: {
          requestId: response.data.requestID, status: 'SUBMITTED', lastHttpStatus: response.status,
          agtErrors: (response.data.errorList ?? []) as unknown as Prisma.InputJsonValue,
          agtErrorHistory: this.history(submission.agtErrorHistory, response.data.errorList, 'registarFactura'),
          submittedAt: new Date(),
        },
      });
    } catch (error) {
      await this.prisma.electronicInvoiceSubmission.update({ where: { id: submission.id }, data: { status: 'ERROR' } });
      throw error;
    }
  }

  async queryStatus(tenantId: string, invoiceId: string) {
    const config = requireAgtEinvoiceConfig();
    const submission = await this.prisma.electronicInvoiceSubmission.findFirst({ where: { tenantId, invoiceId, environment: config.environment } });
    if (!submission?.requestId) throw new NotFoundException('Submissão AGT não encontrada.');
    const invoice = await this.source(tenantId, invoiceId);
    const signaturePayload = { taxRegistrationNumber: invoice.tenant.nif, requestID: submission.requestId };
    const response = await this.client.post<AgtStatusResponse>(config, 'obterEstado', {
      ...this.requestEnvelope(config, invoice.tenant.nif),
      requestID: submission.requestId,
      jwsSignature: this.jws.sign(signaturePayload, config.privateKey),
    });
    const documentResult = response.data.documentStatusList?.find((entry) =>
      !submission.agtDocumentNo || entry.documentNo === submission.agtDocumentNo,
    );
    const status = documentResult?.documentStatus === 'V'
      ? 'VALID'
      : documentResult?.documentStatus === 'I'
        ? 'INVALID'
        : response.data.resultCode === 9
          ? 'REJECTED'
          : 'PROCESSING';
    const errors = [...(response.data.errorList ?? []), ...(documentResult?.errorList ?? [])];
    return this.prisma.electronicInvoiceSubmission.update({
      where: { id: submission.id },
      data: {
        status, lastHttpStatus: response.status,
        agtErrors: errors as unknown as Prisma.InputJsonValue,
        agtErrorHistory: this.history(submission.agtErrorHistory, errors, 'obterEstado'),
        lastAgtResponse: response.data as unknown as unknown as Prisma.InputJsonValue,
        lastCheckedAt: new Date(),
      },
    });
  }

  async queryInvoice(tenantId: string, invoiceId: string) {
    const config = requireAgtEinvoiceConfig();
    const submission = await this.prisma.electronicInvoiceSubmission.findFirst({ where: { tenantId, invoiceId, environment: config.environment } });
    if (!submission?.agtDocumentNo) throw new NotFoundException('Documento electrónico AGT não encontrado.');
    const invoice = await this.source(tenantId, invoiceId);
    const signaturePayload = { taxRegistrationNumber: invoice.tenant.nif, documentNo: submission.agtDocumentNo };
    const response = await this.client.post<AgtInvoiceResponse>(config, 'consultarFactura', {
      ...this.requestEnvelope(config, invoice.tenant.nif),
      documentNo: submission.agtDocumentNo,
      jwsSignature: this.jws.sign(signaturePayload, config.privateKey),
    });
    const status = response.data.validationStatus === 'V' || response.data.validationStatus === 'P'
      ? 'VALID'
      : submission.status;
    const updated = await this.prisma.electronicInvoiceSubmission.update({
      where: { id: submission.id },
      data: {
        status,
        lastHttpStatus: response.status,
        agtErrors: (response.data.errorList ?? []) as unknown as Prisma.InputJsonValue,
        agtErrorHistory: this.history(submission.agtErrorHistory, response.data.errorList, 'consultarFactura'),
        lastAgtResponse: response.data as unknown as unknown as Prisma.InputJsonValue,
        lastCheckedAt: new Date(),
      },
    });
    return { submission: updated, agt: response.data };
  }

  async requestSeries(tenantId: string, dto: RequestElectronicSeriesDto) {
    const config = requireAgtEinvoiceConfig();
    if (config.environment === 'production') {
      throw new BadRequestException({ code: 'AGT_NOT_CERTIFIED', message: 'Criação de série de produção bloqueada enquanto a certificação estiver pendente.' });
    }
    if (process.env.AGT_EINVOICE_TRANSMISSION_ENABLED !== 'true') {
      throw new BadRequestException({ code: 'AGT_TRANSMISSION_DISABLED', message: 'Transmissão AGT desactivada.' });
    }
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { nif: true } });
    if (!tenant?.nif) throw new BadRequestException({ code: 'COMPANY_NIF_MISSING', message: 'NIF do emissor em falta.' });
    const signaturePayload = {
      taxRegistrationNumber: tenant.nif,
      seriesYear: dto.seriesYear,
      documentType: dto.documentType,
      establishmentNumber: dto.establishmentNumber,
      seriesContingencyIndicator: dto.seriesContingencyIndicator,
    };
    const response = await this.client.post<AgtSeriesResponse>(config, 'solicitarSerie', {
      ...this.requestEnvelope(config, tenant.nif),
      ...dto,
      jwsSignature: this.jws.sign(signaturePayload, config.privateKey),
    });
    const series = response.data.seriesFEResult;
    if (!series?.seriesCode) {
      throw new BadRequestException({ code: 'AGT_SERIES_NOT_RETURNED', errors: response.data.errorList ?? [] });
    }
    return this.prisma.electronicInvoiceSeries.upsert({
      where: { tenantId_seriesCode_environment: { tenantId, seriesCode: series.seriesCode, environment: config.environment } },
      update: {
        authorizedQuantity: series.authorizedQuantity == null ? null : Number(series.authorizedQuantity),
        firstDocumentNo: series.firstDocumentNo ?? null,
        lastDocumentNo: series.lastDocumentNo ?? null,
      },
      create: {
        tenantId, seriesCode: series.seriesCode, documentType: dto.documentType,
        seriesYear: dto.seriesYear, establishmentNumber: dto.establishmentNumber,
        contingencyIndicator: dto.seriesContingencyIndicator,
        authorizedQuantity: series.authorizedQuantity == null ? null : Number(series.authorizedQuantity),
        firstDocumentNo: series.firstDocumentNo ?? null,
        lastDocumentNo: series.lastDocumentNo ?? null,
        environment: config.environment,
      },
    });
  }

  private history(existing: Prisma.JsonValue | null, errors: unknown[] | undefined, endpoint: string): Prisma.InputJsonValue {
    const previous = Array.isArray(existing) ? existing : [];
    if (!errors?.length) return previous as unknown as Prisma.InputJsonValue;
    return [...previous, { endpoint, at: new Date().toISOString(), errors }] as unknown as Prisma.InputJsonValue;
  }
}
