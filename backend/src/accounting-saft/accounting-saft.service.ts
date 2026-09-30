import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

const OFFICIAL_AGT_NOTICE =
  'https://portaldocontribuinte.minfin.gov.ao/noticia?id=985578';

@Injectable()
export class AccountingSaftService {
  constructor(private readonly prisma: PrismaService) {}

  async getReadiness(tenantId: string, fiscalYear: number) {
    const periodStart = new Date(Date.UTC(fiscalYear, 0, 1));
    const periodEnd = new Date(Date.UTC(fiscalYear + 1, 0, 1));

    const [
      tenant,
      clients,
      clientsWithoutNif,
      suppliers,
      suppliersWithoutNif,
      products,
      productsWithoutCode,
      salesDocuments,
      purchaseDocuments,
      taxTransactions,
    ] = await this.prisma.$transaction([
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          name: true,
          nif: true,
          address: true,
          regime: true,
        },
      }),
      this.prisma.client.count({ where: { tenantId } }),
      this.prisma.client.count({
        where: { tenantId, OR: [{ nif: null }, { nif: '' }] },
      }),
      this.prisma.supplier.count({ where: { tenantId } }),
      this.prisma.supplier.count({
        where: { tenantId, OR: [{ nif: null }, { nif: '' }] },
      }),
      this.prisma.product.count({ where: { tenantId } }),
      this.prisma.product.count({
        where: { tenantId, OR: [{ code: null }, { code: '' }] },
      }),
      this.prisma.invoice.count({
        where: {
          tenantId,
          issuedAt: { gte: periodStart, lt: periodEnd },
        },
      }),
      this.prisma.purchaseInvoice.count({
        where: {
          tenantId,
          issuedAt: { gte: periodStart, lt: periodEnd },
        },
      }),
      this.prisma.taxTransaction.count({
        where: {
          tenantId,
          referenceDate: { gte: periodStart, lt: periodEnd },
        },
      }),
    ]);

    if (!tenant) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    const dataQualityIssues = [
      ...(clientsWithoutNif > 0
        ? [
            {
              code: 'CLIENTS_WITHOUT_NIF',
              severity: 'WARNING' as const,
              count: clientsWithoutNif,
              message: 'Existem clientes sem NIF registado.',
            },
          ]
        : []),
      ...(suppliersWithoutNif > 0
        ? [
            {
              code: 'SUPPLIERS_WITHOUT_NIF',
              severity: 'WARNING' as const,
              count: suppliersWithoutNif,
              message: 'Existem fornecedores sem NIF registado.',
            },
          ]
        : []),
      ...(productsWithoutCode > 0
        ? [
            {
              code: 'PRODUCTS_WITHOUT_CODE',
              severity: 'WARNING' as const,
              count: productsWithoutCode,
              message: 'Existem produtos ou serviços sem código interno.',
            },
          ]
        : []),
    ];

    return {
      kind: 'SAF-T (AO) de contabilidade',
      fiscalYear,
      period: {
        start: periodStart.toISOString().slice(0, 10),
        end: new Date(periodEnd.getTime() - 1).toISOString().slice(0, 10),
      },
      canExport: false,
      exportEndpointAvailable: false,
      legalReference: {
        diploma: 'Decreto Executivo n.º 317/20, de 14 de Dezembro',
        officialNoticeUrl: OFFICIAL_AGT_NOTICE,
        officialNoticeConsultedAt: '2026-09-29',
        confirmedStructure: ['Cabeçalho', 'Tabelas mestres', 'Movimentos contabilísticos'],
      },
      schema: {
        status: 'PENDING_VERIFIED_OFFICIAL_ARTIFACT',
        version: null,
        message:
          'O XML e a validação XSD permanecem desactivados até existir um artefacto oficial integral, versionado e testado.',
      },
      sections: {
        header: {
          state: tenant.name && tenant.nif ? 'PARTIAL' : 'INCOMPLETE',
          company: {
            namePresent: Boolean(tenant.name?.trim()),
            nifPresent: Boolean(tenant.nif?.trim()),
            addressPresent: Boolean(tenant.address?.trim()),
            fiscalRegimePresent: Boolean(tenant.regime),
          },
        },
        masterData: {
          state: 'PARTIAL',
          clients,
          suppliers,
          products,
        },
        accountingMovements: {
          state: 'BLOCKED',
          journalEntries: 0,
          salesDocuments,
          purchaseDocuments,
          taxTransactions,
          message:
            'Os documentos comerciais e movimentos fiscais existentes não substituem lançamentos contabilísticos de partidas dobradas.',
        },
      },
      blockingIssues: [
        {
          code: 'OFFICIAL_SCHEMA_NOT_EMBEDDED',
          severity: 'BLOCKING',
          message:
            'A estrutura XML/XSD oficial integral e a sua versão ainda não foram incorporadas e validadas.',
        },
        {
          code: 'CHART_OF_ACCOUNTS_NOT_IMPLEMENTED',
          severity: 'BLOCKING',
          message: 'O projecto ainda não possui plano de contas contabilístico.',
        },
        {
          code: 'GENERAL_LEDGER_NOT_IMPLEMENTED',
          severity: 'BLOCKING',
          message:
            'O projecto ainda não possui diários, lançamentos a débito/crédito e saldos contabilísticos.',
        },
        {
          code: 'MONETARY_PRECISION_PENDING',
          severity: 'BLOCKING',
          message:
            'Facturas, compras e movimentos fiscais ainda usam Float em campos monetários relevantes.',
        },
      ],
      dataQualityIssues,
    };
  }
}
