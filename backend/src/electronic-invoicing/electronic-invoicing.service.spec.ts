import { NotFoundException } from '@nestjs/common';
import { ElectronicInvoicingService } from './electronic-invoicing.service';

const configuredEnv = {
  AGT_EINVOICE_ENVIRONMENT: 'homologation', AGT_EINVOICE_USERNAME: 'user',
  AGT_EINVOICE_PASSWORD: 'password', AGT_EINVOICE_PRODUCT_ID: 'product',
  AGT_EINVOICE_PRODUCT_VERSION: '1.0', AGT_EINVOICE_SOFTWARE_VALIDATION_NUMBER: 'pending-test',
  AGT_EINVOICE_SIGNATURE_VERSION: '1', AGT_EINVOICE_PRIVATE_KEY: 'mock-key',
  AGT_EINVOICE_TRANSMISSION_ENABLED: 'true',
};

function invoice(overrides: Record<string, unknown> = {}) {
  return {
    id: 'invoice-a', tenantId: 'tenant-a', documentType: 'NORMAL', fiscalDocumentType: 'FT', fiscalYear: 2026,
    fiscalSequence: 1, fiscalHash: 'hash', issuedAt: new Date('2026-10-03'), createdAt: new Date('2026-10-03'),
    subtotal: 100, subtotalAmount: null, iva: 14, ivaAmount: null, total: 114, totalAmount: null,
    tenant: { id: 'tenant-a', name: 'Empresa A', nif: '5000000000', address: 'Luanda', city: 'Luanda' },
    client: { name: 'Cliente', nif: '5000000001', country: 'AO' },
    items: [{ id: 'line-a', productName: 'Serviço', quantity: 1, quantityAmount: null, unitPrice: 100, unitPriceAmount: null, total: 100, totalAmount: null, unit: 'SERVICO', taxType: 'IVA', taxCode: 'NOR', taxRate: 14, taxAmount: 14, electronicOperationType: 'SG', product: { code: 'S1' } }],
    ...overrides,
  };
}

function setup() {
  const prisma: any = {
    invoice: { findFirst: jest.fn() },
    electronicInvoiceSeries: { findFirst: jest.fn(), findMany: jest.fn(), upsert: jest.fn() },
    electronicInvoiceSubmission: { findMany: jest.fn(), findFirst: jest.fn(), upsert: jest.fn(), update: jest.fn() },
    tenant: { findUnique: jest.fn() },
  };
  const client: any = { post: jest.fn() };
  const jws: any = { sign: jest.fn(() => 'header.payload.signature') };
  return { prisma, client, jws, service: new ElectronicInvoicingService(prisma, client, jws) };
}

describe('ElectronicInvoicingService', () => {
  const oldEnv = { ...process.env };
  beforeEach(() => Object.assign(process.env, configuredEnv));
  afterEach(() => { process.env = { ...oldEnv }; jest.restoreAllMocks(); });

  it('derives tenant scope on preflight and never returns another tenant invoice', async () => {
    const { prisma, service } = setup();
    prisma.invoice.findFirst.mockResolvedValue(null);
    await expect(service.preflight('tenant-a', 'invoice-b')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.invoice.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'invoice-b', tenantId: 'tenant-a', documentType: 'NORMAL' } }));
  });

  it('blocks missing explicit AGT operation type instead of inferring it from unit', async () => {
    const { prisma, service } = setup();
    prisma.invoice.findFirst.mockResolvedValue(invoice({ items: [{ ...invoice().items[0], electronicOperationType: null }] }));
    prisma.electronicInvoiceSeries.findFirst.mockResolvedValue({ id: 'series-a', seriesCode: 'FT26SEDE' });
    const result = await service.preflight('tenant-a', 'invoice-a');
    expect(result.ready).toBe(false);
    expect(result.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'OPERATION_TYPE_MISSING' })]));
  });

  it('reuses persisted submission and requestID on repeated submit', async () => {
    const { prisma, client, service } = setup();
    prisma.invoice.findFirst.mockResolvedValue(invoice());
    prisma.electronicInvoiceSeries.findFirst.mockResolvedValue({ id: 'series-a', seriesCode: 'FT26SEDE' });
    const persisted = { id: 'submission-a', invoiceId: 'invoice-a', submissionUuid: '39ff6218-4a3d-4aed-a489-cc779f7b92de', requestId: 'REQ1', status: 'SUBMITTED', agtErrorHistory: null };
    prisma.electronicInvoiceSubmission.upsert.mockResolvedValue(persisted);
    await expect(service.submit('tenant-a', 'invoice-a')).resolves.toBe(persisted);
    expect(prisma.electronicInvoiceSubmission.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { invoiceId_environment: { invoiceId: 'invoice-a', environment: 'homologation' } },
    }));
    expect(client.post).not.toHaveBeenCalled();
  });

  it('signs and persists status query response without overwriting the invoice', async () => {
    const { prisma, client, service } = setup();
    prisma.electronicInvoiceSubmission.findFirst.mockResolvedValue({ id: 'submission-a', invoiceId: 'invoice-a', requestId: 'REQ1', agtDocumentNo: 'FT SERIES/1', agtErrorHistory: null });
    prisma.invoice.findFirst.mockResolvedValue(invoice());
    client.post.mockResolvedValue({ status: 200, data: { requestID: 'REQ1', resultCode: 0, documentStatusList: [{ documentNo: 'FT SERIES/1', documentStatus: 'V' }] } });
    prisma.electronicInvoiceSubmission.update.mockResolvedValue({ status: 'VALID' });
    await expect(service.queryStatus('tenant-a', 'invoice-a')).resolves.toEqual({ status: 'VALID' });
    expect(prisma.electronicInvoiceSubmission.findFirst).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-a', invoiceId: 'invoice-a', environment: 'homologation' },
    });
    expect(prisma.electronicInvoiceSubmission.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'VALID' }) }));
    expect(prisma.invoice.update).toBeUndefined();
  });

  it('runs the mocked prepare, preflight, sign, submit, requestID persist and poll flow', async () => {
    const { prisma, client, jws, service } = setup();
    prisma.invoice.findFirst.mockResolvedValue(invoice());
    prisma.electronicInvoiceSeries.findFirst.mockResolvedValue({ id: 'series-a', seriesCode: 'FT26SEDE' });
    prisma.electronicInvoiceSubmission.upsert.mockResolvedValue({ id: 'submission-a', invoiceId: 'invoice-a', submissionUuid: '39ff6218-4a3d-4aed-a489-cc779f7b92de', requestId: null, status: 'READY', agtDocumentNo: null, agtErrorHistory: null });
    prisma.electronicInvoiceSubmission.update
      .mockResolvedValueOnce({ status: 'SUBMITTING' })
      .mockResolvedValueOnce({ id: 'submission-a', requestId: 'REQ1', status: 'SUBMITTED' })
      .mockResolvedValueOnce({ status: 'VALID' });
    client.post
      .mockResolvedValueOnce({ status: 200, data: { requestID: 'REQ1' } })
      .mockResolvedValueOnce({ status: 200, data: { requestID: 'REQ1', resultCode: 0, documentStatusList: [{ documentNo: 'FT FT26SEDE/1', documentStatus: 'V' }] } });
    const submitted = await service.submit('tenant-a', 'invoice-a');
    expect(submitted).toMatchObject({ requestId: 'REQ1', status: 'SUBMITTED' });
    expect(jws.sign).toHaveBeenCalledTimes(2);
    prisma.electronicInvoiceSubmission.findFirst.mockResolvedValue({ id: 'submission-a', invoiceId: 'invoice-a', requestId: 'REQ1', agtDocumentNo: 'FT FT26SEDE/1', agtErrorHistory: null });
    await expect(service.queryStatus('tenant-a', 'invoice-a')).resolves.toMatchObject({ status: 'VALID' });
    expect(client.post).toHaveBeenNthCalledWith(1, expect.anything(), 'registarFactura', expect.objectContaining({ numberOfEntries: 1 }));
    expect(client.post).toHaveBeenNthCalledWith(2, expect.anything(), 'obterEstado', expect.objectContaining({ requestID: 'REQ1', jwsSignature: expect.any(String) }));
  });

  it('queries an invoice with a signed documentNo without mutating fiscal history', async () => {
    const { prisma, client, service } = setup();
    prisma.electronicInvoiceSubmission.findFirst.mockResolvedValue({ id: 'submission-a', invoiceId: 'invoice-a', requestId: 'REQ1', agtDocumentNo: 'FT SERIES/1', status: 'SUBMITTED', agtErrorHistory: null });
    prisma.invoice.findFirst.mockResolvedValue(invoice());
    client.post.mockResolvedValue({ status: 200, data: { documentNo: 'FT SERIES/1', validationStatus: 'P', documents: [] } });
    prisma.electronicInvoiceSubmission.update.mockResolvedValue({ status: 'VALID' });
    await expect(service.queryInvoice('tenant-a', 'invoice-a')).resolves.toMatchObject({ submission: { status: 'VALID' } });
    expect(client.post).toHaveBeenCalledWith(expect.anything(), 'consultarFactura', expect.objectContaining({ documentNo: 'FT SERIES/1', jwsSignature: expect.any(String) }));
    expect(prisma.invoice.update).toBeUndefined();
  });

  it('persists only an AGT-returned series for the authenticated tenant', async () => {
    const { prisma, client, service } = setup();
    prisma.tenant.findUnique.mockResolvedValue({ nif: '5000000000' });
    client.post.mockResolvedValue({ status: 200, data: { resultCode: 1, seriesFEResult: { seriesCode: 'FT26SEDE', authorizedQuantity: '100', firstDocumentNo: '1', lastDocumentNo: '100' } } });
    prisma.electronicInvoiceSeries.upsert.mockResolvedValue({ tenantId: 'tenant-a', seriesCode: 'FT26SEDE' });
    await expect(service.requestSeries('tenant-a', { seriesYear: 2026, documentType: 'FT', establishmentNumber: 'SEDE', seriesContingencyIndicator: 'N' })).resolves.toEqual({ tenantId: 'tenant-a', seriesCode: 'FT26SEDE' });
    expect(prisma.electronicInvoiceSeries.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ tenantId: 'tenant-a', seriesCode: 'FT26SEDE' }),
    }));
  });

  it('reports NOT_CERTIFIED and blocks production transmission', async () => {
    const { service } = setup();
    expect(service.readiness()).toMatchObject({ certificationStatus: 'NOT_CERTIFIED' });
    process.env.AGT_EINVOICE_ENVIRONMENT = 'production';
    await expect(service.submit('tenant-a', 'invoice-a')).rejects.toMatchObject({ response: expect.objectContaining({ code: 'AGT_NOT_CERTIFIED' }) });
  });
});
