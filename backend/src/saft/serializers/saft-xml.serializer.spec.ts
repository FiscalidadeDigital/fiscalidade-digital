import { SaftAuditFile } from '../model/audit-file.model';
import { SaftXmlSerializer } from './saft-xml.serializer';

const fixture = (): SaftAuditFile => ({
  header: {
    AuditFileVersion: '1.01_01', CompanyID: 'tenant-a', TaxRegistrationNumber: '5000000000',
    TaxAccountingBasis: 'F', CompanyName: 'A & B <Comércio>', FiscalYear: 2026,
    StartDate: '2026-01-01', EndDate: '2026-01-31', CurrencyCode: 'AOA', DateCreated: '2026-02-01',
    TaxEntity: 'Global', ProductCompanyTaxID: 'PENDING', SoftwareValidationNumber: 0,
    ProductID: 'Fiscalidade Digital', ProductVersion: '1.0',
  },
  customers: [], products: [], taxes: [], totalDebit: '0.00', totalCredit: '114.00',
  invoices: [{
    invoiceNo: 'FT 2026/1', status: 'N', statusDate: '2026-01-10T10:00:00', hash: '0', hashControl: '0',
    invoiceDate: '2026-01-10', invoiceType: 'FT', sourceId: 'user-a', systemEntryDate: '2026-01-10T10:00:00',
    customerId: 'C-1', taxPayable: '14.00', netTotal: '100.00', grossTotal: '114.00',
    lines: [{ lineNumber: 1, productCode: 'P-1', productDescription: 'Consultoria "Fiscal" & Contabilidade', quantity: '1.0000', unitOfMeasure: 'UN', unitPrice: '100.00', taxPointDate: '2026-01-10', description: 'Consultoria "Fiscal" & Contabilidade', creditAmount: '100.00', tax: { taxType: 'IVA', taxCode: 'NOR', taxPercentage: '14.0000' } }],
  }],
});

describe('SaftXmlSerializer', () => {
  const serializer = new SaftXmlSerializer();

  it('serializa UTF-8, namespace, datas e decimais', () => {
    const xml = serializer.serialize(fixture());
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('urn:OECD:StandardAuditFile-Tax:AO_1.01_01');
    expect(xml).toContain('<InvoiceDate>2026-01-10</InvoiceDate>');
    expect(xml).toContain('<GrossTotal>114.00</GrossTotal>');
  });

  it('escapa caracteres reservados sem perder o conteúdo', () => {
    const xml = serializer.serialize(fixture());
    expect(xml).toContain('A &amp; B &lt;Comércio&gt;');
    expect(xml).toContain('Consultoria "Fiscal" &amp; Contabilidade');
  });

  it('não produz valores textuais inválidos', () => {
    const xml = serializer.serialize(fixture());
    expect(xml).not.toMatch(/>\s*(undefined|null|NaN|Infinity)\s*</);
  });
});
