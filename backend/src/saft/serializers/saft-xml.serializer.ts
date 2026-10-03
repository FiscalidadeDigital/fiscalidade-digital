import { create } from 'xmlbuilder2';
import type { XMLBuilder } from 'xmlbuilder2/lib/interfaces';
import { Injectable } from '@nestjs/common';
import { SAFT_NAMESPACE, SaftAuditFile } from '../model/audit-file.model';

@Injectable()
export class SaftXmlSerializer {
  serialize(model: SaftAuditFile): string {
    const root = create({ version: '1.0', encoding: 'UTF-8' })
      .ele(SAFT_NAMESPACE, 'AuditFile');
    const header = root.ele('Header');
    this.object(header, model.header);
    const master = root.ele('MasterFiles');
    model.customers.forEach((entry) => this.object(master.ele('Customer'), entry));
    model.products.forEach((entry) => this.object(master.ele('Product'), entry));
    if (model.taxes.length) {
      const table = master.ele('TaxTable');
      model.taxes.forEach((entry) => this.object(table.ele('TaxTableEntry'), entry));
    }
    const source = root.ele('SourceDocuments');
    const sales = source.ele('SalesInvoices');
    sales.ele('NumberOfEntries').txt(String(model.invoices.length));
    sales.ele('TotalDebit').txt(model.totalDebit);
    sales.ele('TotalCredit').txt(model.totalCredit);
    model.invoices.forEach((invoice) => {
      const node = sales.ele('Invoice');
      node.ele('InvoiceNo').txt(invoice.invoiceNo);
      const status = node.ele('DocumentStatus');
      status.ele('InvoiceStatus').txt(invoice.status);
      status.ele('InvoiceStatusDate').txt(invoice.statusDate);
      if (invoice.reason) status.ele('Reason').txt(invoice.reason);
      status.ele('SourceID').txt(invoice.sourceId);
      status.ele('SourceBilling').txt('P');
      node.ele('Hash').txt(invoice.hash);
      node.ele('HashControl').txt(invoice.hashControl);
      node.ele('InvoiceDate').txt(invoice.invoiceDate);
      node.ele('InvoiceType').txt(invoice.invoiceType);
      this.object(node.ele('SpecialRegimes'), { SelfBillingIndicator: 0, CashVATSchemeIndicator: 0, ThirdPartiesBillingIndicator: 0 });
      node.ele('SourceID').txt(invoice.sourceId);
      node.ele('SystemEntryDate').txt(invoice.systemEntryDate);
      node.ele('CustomerID').txt(invoice.customerId);
      invoice.lines.forEach((line) => {
        const item = node.ele('Line');
        item.ele('LineNumber').txt(String(line.lineNumber));
        item.ele('ProductCode').txt(line.productCode);
        item.ele('ProductDescription').txt(line.productDescription);
        item.ele('Quantity').txt(line.quantity);
        item.ele('UnitOfMeasure').txt(line.unitOfMeasure);
        item.ele('UnitPrice').txt(line.unitPrice);
        item.ele('TaxPointDate').txt(line.taxPointDate);
        item.ele('Description').txt(line.description);
        item.ele('CreditAmount').txt(line.creditAmount);
        this.object(item.ele('Tax'), { TaxType: line.tax.taxType, TaxCountryRegion: 'AO', TaxCode: line.tax.taxCode, TaxPercentage: line.tax.taxPercentage });
        if (line.taxExemptionReason && line.taxExemptionCode) {
          item.ele('TaxExemptionReason').txt(line.taxExemptionReason);
          item.ele('TaxExemptionCode').txt(line.taxExemptionCode);
        }
      });
      this.object(node.ele('DocumentTotals'), { TaxPayable: invoice.taxPayable, NetTotal: invoice.netTotal, GrossTotal: invoice.grossTotal });
    });
    const xml = root.end({ prettyPrint: true });
    if (/\b(?:undefined|null|NaN|Infinity)\b/.test(xml)) throw new Error('SAF-T contém valor textual inválido.');
    return xml;
  }

  private object(node: XMLBuilder, value: Record<string, unknown>) {
    Object.entries(value).forEach(([key, entry]) => {
      if (entry === undefined || entry === null) return;
      const child = node.ele(key);
      if (typeof entry === 'object' && !Array.isArray(entry)) this.object(child, entry as Record<string, unknown>);
      else child.txt(String(entry));
    });
  }
}
