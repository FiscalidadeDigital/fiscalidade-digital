const permittedRoles = new Set(['OWNER', 'ADMIN', 'ACCOUNTANT']);

function hasInvoiceLineItems(invoice) {
  return Array.isArray(invoice?.items) && invoice.items.length > 0;
}

function canCreateInvoiceAdjustment(invoice, role, isProForma = false) {
  const fiscalDocumentType = invoice?.fiscalDocumentType ?? 'FT';

  return (
    !isProForma &&
    fiscalDocumentType === 'FT' &&
    invoice?.status !== 'CANCELLED' &&
    permittedRoles.has(role ?? '') &&
    hasInvoiceLineItems(invoice)
  );
}

module.exports = {
  canCreateInvoiceAdjustment,
  hasInvoiceLineItems,
};
