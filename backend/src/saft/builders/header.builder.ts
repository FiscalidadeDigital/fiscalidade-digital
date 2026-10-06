import { SAFT_SCHEMA_VERSION } from '../model/audit-file.model';

export type HeaderInput = { id: string; nif: string; name: string; address: string; city: string; country?: string; email?: string | null };
export type SoftwareHeaderInput = {
  productCompanyTaxId: string;
  softwareValidationNumber: string;
  productId: string;
  productVersion: string;
};

export function buildHeader(tenant: HeaderInput, start: Date, end: Date, software: SoftwareHeaderInput, created = new Date()) {
  return {
    AuditFileVersion: SAFT_SCHEMA_VERSION,
    CompanyID: tenant.id,
    TaxRegistrationNumber: tenant.nif,
    TaxAccountingBasis: 'F',
    CompanyName: tenant.name,
    CompanyAddress: { AddressDetail: tenant.address, City: tenant.city, Country: tenant.country ?? 'AO' },
    FiscalYear: start.getUTCFullYear(),
    StartDate: start.toISOString().slice(0, 10), EndDate: end.toISOString().slice(0, 10),
    CurrencyCode: 'AOA', DateCreated: created.toISOString().slice(0, 10), TaxEntity: 'Global',
    ProductCompanyTaxID: software.productCompanyTaxId,
    SoftwareValidationNumber: software.softwareValidationNumber,
    ProductID: software.productId,
    ProductVersion: software.productVersion,
    ...(tenant.email ? { Email: tenant.email } : {}),
  };
}
