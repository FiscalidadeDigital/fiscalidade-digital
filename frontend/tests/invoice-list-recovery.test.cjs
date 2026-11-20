const assert = require('node:assert/strict');
const test = require('node:test');

const {
  invoicePageNeedsRecovery,
  recoverInvoicePage,
} = require('../lib/invoice-list-recovery');

function invoice(id, number, status, total, issuedAt) {
  return {
    id,
    invoiceNumber: number,
    status,
    total,
    documentType: 'NORMAL',
    fiscalDocumentType: 'FT',
    issuedAt,
    client: { name: 'Jorge Carlos', nif: '50005050' },
  };
}

test('detecta quando uma página informa mais facturas do que apresenta', () => {
  const page = {
    data: [invoice('one', 'FT-2026-00001', 'PAID', 570000, '2026-09-22')],
    pagination: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
  };

  assert.equal(invoicePageNeedsRecovery(page), true);
});

test('recupera a lista completa somente quando a colecção confirma a mesma contagem', () => {
  const first = invoice('one', 'FT-2026-00001', 'PAID', 570000, '2026-09-22');
  const second = invoice(
    'two',
    'FT-2026-00002',
    'PENDING',
    40000,
    '2026-09-23',
  );
  const page = {
    data: [first],
    pagination: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
  };

  const recovered = recoverInvoicePage(page, [first, second], {
    fiscalDocumentType: 'FT',
    page: 1,
    pageSize: 20,
    sortBy: 'issuedAt',
    sortDirection: 'desc',
  });

  assert.deepEqual(
    recovered.data.map((item) => item.invoiceNumber),
    ['FT-2026-00002', 'FT-2026-00001'],
  );
  assert.equal(recovered.pagination.total, 2);
});

test('preserva a resposta original quando a confirmação não corresponde', () => {
  const first = invoice('one', 'FT-2026-00001', 'PAID', 570000, '2026-09-22');
  const page = {
    data: [first],
    pagination: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
  };

  assert.equal(
    recoverInvoicePage(page, [first], { fiscalDocumentType: 'FT', page: 1 }),
    page,
  );
});
