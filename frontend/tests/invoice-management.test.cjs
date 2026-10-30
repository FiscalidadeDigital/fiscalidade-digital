const assert = require('node:assert/strict');
const test = require('node:test');

async function loadInvoiceManagement() {
  return import('../lib/invoice-management.js');
}

test('todas as famílias de Gestão de facturas activam a entrada central', async () => {
  const { isInvoiceManagementPath } = await loadInvoiceManagement();

  [
    '/invoices',
    '/invoices/new',
    '/invoices/abc-123',
    '/purchase-invoices',
    '/purchase-invoices/import',
    '/purchase-invoices/abc-123',
    '/pro-formas',
    '/pro-formas/new',
    '/pro-formas/abc-123',
    '/electronic-invoicing',
  ].forEach((pathname) => {
    assert.equal(isInvoiceManagementPath(pathname), true, pathname);
  });
});

test('rotas fora da área de facturas não activam a entrada central', async () => {
  const { isInvoiceManagementPath } = await loadInvoiceManagement();

  ['/dashboard', '/payments', '/accounting/saft', '/library'].forEach(
    (pathname) => {
      assert.equal(isInvoiceManagementPath(pathname), false, pathname);
    },
  );
});

test('a rota activa conserva os parâmetros fora da comparação de caminho', async () => {
  const { isInvoiceManagementItemActive } = await loadInvoiceManagement();

  assert.equal(
    isInvoiceManagementItemActive('/invoices?status=PENDING', '/invoices'),
    true,
  );
  assert.equal(
    isInvoiceManagementItemActive('/invoices/abc-123#documento', '/invoices'),
    true,
  );
});
