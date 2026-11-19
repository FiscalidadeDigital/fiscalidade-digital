const assert = require('node:assert/strict');
const test = require('node:test');

const {
  canCreateInvoiceAdjustment,
  hasInvoiceLineItems,
} = require('../lib/invoice-adjustments.js');

const completeInvoice = {
  fiscalDocumentType: 'FT',
  status: 'PAID',
  items: [{ id: 'item-1' }],
};

test('permite notas somente para uma factura activa com linhas registadas', () => {
  assert.equal(hasInvoiceLineItems(completeInvoice), true);
  assert.equal(
    canCreateInvoiceAdjustment(completeInvoice, 'ACCOUNTANT'),
    true,
  );
});

test('bloqueia notas para facturas sem linhas registadas', () => {
  const invoiceWithoutItems = { ...completeInvoice, items: [] };

  assert.equal(hasInvoiceLineItems(invoiceWithoutItems), false);
  assert.equal(
    canCreateInvoiceAdjustment(invoiceWithoutItems, 'OWNER'),
    false,
  );
});
