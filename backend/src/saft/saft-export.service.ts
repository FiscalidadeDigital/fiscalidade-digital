import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceDocumentType, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { buildCustomers } from './builders/customers.builder';
import { buildHeader, SoftwareHeaderInput } from './builders/header.builder';
import { buildProducts } from './builders/products.builder';
import { buildSalesInvoices } from './builders/sales-invoices.builder';
import { buildTaxTable } from './builders/tax-table.builder';
import { SaftAuditFile } from './model/audit-file.model';
import { SaftXmlSerializer } from './serializers/saft-xml.serializer';
import { SaftXsdValidator } from './validators/saft-xsd.validator';
import { FiscalSignatureService } from '../fiscal-signature/fiscal-signature.service';

export type SaftIssue = { code: string; severity: 'BLOCKING' | 'WARNING'; message: string; count?: number };

@Injectable()
export class SaftExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly serializer: SaftXmlSerializer,
    private readonly validator: SaftXsdValidator,
    private readonly fiscalSignature: FiscalSignatureService,
  ) {}

  private period(year: number) {
    return { start: new Date(Date.UTC(year, 0, 1)), endExclusive: new Date(Date.UTC(year + 1, 0, 1)) };
  }

  private software(): SoftwareHeaderInput | null {
    const value = {
      productCompanyTaxId: process.env.SAFT_PRODUCT_COMPANY_TAX_ID?.trim() ?? '',
      softwareValidationNumber: process.env.AGT_SOFTWARE_CERTIFICATE_NUMBER?.trim() ?? '',
      productId: process.env.AGT_SOFTWARE_PRODUCT_ID?.trim() ?? '',
      productVersion: process.env.SAFT_PRODUCT_VERSION?.trim() ?? process.env.npm_package_version?.trim() ?? '',
    };
    return Object.values(value).every(Boolean) ? value : null;
  }

  private async source(tenantId: string, fiscalYear: number) {
    const { start, endExclusive } = this.period(fiscalYear);
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, nif: true, name: true, address: true, city: true, country: true, email: true },
    });
    if (!tenant) throw new NotFoundException('Empresa não encontrada.');
    const invoices = await this.prisma.invoice.findMany({
      where: { tenantId, documentType: InvoiceDocumentType.NORMAL, issuedAt: { gte: start, lt: endExclusive } },
      include: { client: true, items: { include: { product: { select: { code: true } } } } },
      orderBy: [{ fiscalSeries: 'asc' }, { fiscalSequence: 'asc' }, { createdAt: 'asc' }],
    });
    return { tenant, invoices, start, end: new Date(endExclusive.getTime() - 1) };
  }

  async preflight(tenantId: string, fiscalYear: number) {
    const { tenant, invoices, start, end } = await this.source(tenantId, fiscalYear);
    const issues: SaftIssue[] = [];
    if (!tenant.nif || !tenant.name || !tenant.address || !tenant.city) issues.push({ code: 'COMPANY_DATA_MISSING', severity: 'BLOCKING', message: 'Nome, NIF, morada e cidade da empresa são obrigatórios.' });
    const invalidCustomers = new Set(invoices.filter((item) => !item.client.nif || !item.client.name || !item.client.address || !item.client.city).map((item) => item.clientId));
    if (invalidCustomers.size) issues.push({ code: 'CUSTOMER_DATA_MISSING', severity: 'BLOCKING', count: invalidCustomers.size, message: 'Existem clientes usados no período sem NIF, nome, morada ou cidade.' });
    const unsigned = invoices.filter((item) => !item.fiscalHash || !item.fiscalHashControl);
    if (unsigned.length) issues.push({ code: 'LEGACY_UNSIGNED_DOCUMENT', severity: 'BLOCKING', count: unsigned.length, message: 'Existem documentos históricos sem assinatura fiscal persistida.' });
    const invalidTax = invoices.flatMap((invoice) => invoice.items).filter((line) => !line.taxType || !line.taxCode || line.taxRate == null);
    if (invalidTax.length) issues.push({ code: 'INVALID_TAX_METADATA', severity: 'BLOCKING', count: invalidTax.length, message: 'Existem linhas sem classificação fiscal persistida.' });
    const missingExemption = invoices.flatMap((invoice) => invoice.items).filter((line) => line.taxRate?.isZero() && (!line.taxExemptionCode || !line.taxExemptionReason));
    if (missingExemption.length) issues.push({ code: 'EXEMPTION_REASON_MISSING', severity: 'BLOCKING', count: missingExemption.length, message: 'Existem linhas com taxa zero sem código e motivo de isenção.' });
    const signatureConfiguration = this.fiscalSignature.configuration();
    if (!signatureConfiguration.configured) issues.push({
      code: 'FISCAL_SIGNATURE_NOT_CONFIGURED',
      severity: 'BLOCKING',
      message: signatureConfiguration.blocker?.message ?? 'A assinatura fiscal técnica não está configurada.',
    });
    if (!this.software()) issues.push({ code: 'CERTIFICATION_CONFIGURATION_MISSING', severity: 'BLOCKING', message: 'Os dados oficiais do produtor, produto e validação do software não estão configurados.' });
    issues.push({ code: 'CERTIFICATION_PENDING', severity: 'WARNING', message: 'A implementação não possui certificação AGT confirmada.' });
    return { fiscalYear, period: { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }, technicalReadiness: !issues.some((issue) => issue.severity === 'BLOCKING'), certificationReadiness: false, certificationStatus: 'NOT_CERTIFIED' as const, issues };
  }

  async summary(tenantId: string, fiscalYear: number) {
    const { invoices } = await this.source(tenantId, fiscalYear);
    const preflight = await this.preflight(tenantId, fiscalYear);
    const active = invoices.filter((invoice) => invoice.status !== 'CANCELLED');
    const sum = (selector: (invoice: (typeof invoices)[number]) => Prisma.Decimal) => active.reduce((total, invoice) => total.add(selector(invoice)), new Prisma.Decimal(0)).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP).toFixed(2);
    return {
      documentCount: invoices.length,
      customerCount: new Set(invoices.map((item) => item.clientId)).size,
      productCount: new Set(invoices.flatMap((invoice) => invoice.items.map((line) => line.productId ?? line.productName))).size,
      cancelledCount: invoices.length - active.length,
      signedDocumentCount: invoices.filter((item) => item.fiscalHash && item.fiscalHashControl).length,
      unsignedDocumentCount: invoices.filter((item) => !item.fiscalHash || !item.fiscalHashControl).length,
      taxableBase: sum((invoice) => new Prisma.Decimal(invoice.subtotalAmount?.toString() ?? String(invoice.subtotal))),
      taxAmount: sum((invoice) => new Prisma.Decimal(invoice.ivaAmount?.toString() ?? String(invoice.iva))),
      grossTotal: sum((invoice) => new Prisma.Decimal(invoice.totalAmount?.toString() ?? String(invoice.total))),
      warnings: preflight.issues.filter((issue) => issue.severity === 'WARNING'),
      errors: preflight.issues.filter((issue) => issue.severity === 'BLOCKING'),
    };
  }

  async generate(tenantId: string, userId: string, fiscalYear: number) {
    const preflight = await this.preflight(tenantId, fiscalYear);
    if (!preflight.technicalReadiness) throw new BadRequestException({ code: 'SAFT_PREFLIGHT_FAILED', issues: preflight.issues });
    const { tenant, invoices, start, end } = await this.source(tenantId, fiscalYear);
    const software = this.software()!;
    const model = this.compose({ tenant: tenant as Required<typeof tenant>, invoices, start, end, software, sourceId: userId });
    const xml = this.serializer.serialize(model);
    const validation = await this.validator.validate(xml);
    if (!validation.valid) throw new BadRequestException({ code: 'TECHNICAL_XSD_VALIDATION_FAILED', validation });
    return { xml, validation, filename: `SAFT-AO-${tenant.nif}-${fiscalYear}.xml` };
  }

  compose(input: { tenant: { id: string; nif: string; name: string; address: string; city: string; country: string | null; email: string | null }; invoices: any[]; start: Date; end: Date; software: SoftwareHeaderInput; sourceId: string }): SaftAuditFile {
    const lines = input.invoices.flatMap((invoice) => invoice.items);
    const customers = [...new Map(input.invoices.map((invoice) => [invoice.client.id, invoice.client])).values()] as any[];
    return {
      header: buildHeader({ ...input.tenant, country: input.tenant.country ?? 'AO' }, input.start, input.end, input.software),
      customers: buildCustomers(customers.map((client) => ({ id: client.id, nif: client.nif, name: client.name, accountId: client.id, address: client.address, city: client.city, country: client.country, email: client.email }))),
      products: buildProducts(lines),
      taxes: buildTaxTable(lines),
      invoices: buildSalesInvoices(input.invoices, input.sourceId),
      totalDebit: '0.00',
      totalCredit: input.invoices.filter((invoice) => invoice.status !== 'CANCELLED').reduce((total, invoice) => total.add(new Prisma.Decimal(invoice.totalAmount?.toString() ?? String(invoice.total))), new Prisma.Decimal(0)).toDecimalPlaces(2).toFixed(2),
    };
  }
}
