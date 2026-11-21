const assert = require('node:assert/strict');
const test = require('node:test');

const {
  prepareFiscalReportDocuments,
  uniqueFiscalDocuments,
} = require('../lib/fiscal-report-documents.js');

test('inclui FT, NC e ND, desconta NC e retira documentos anulados dos montantes', () => {
  const ft = {
    id: 'ft-1',
    fiscalDocumentType: 'FT',
    status: 'PAID',
    issuedAt: '2026-09-22T10:00:00.000Z',
    subtotal: 100,
    iva: 14,
    total: 114,
  };
  const nc = {
    id: 'nc-1',
    fiscalDocumentType: 'NC',
    status: 'PAID',
    issuedAt: '2026-09-23T10:00:00.000Z',
    subtotal: 20,
    iva: 3,
    total: 23,
  };
  const nd = {
    id: 'nd-1',
    fiscalDocumentType: 'ND',
    status: 'PENDING',
    issuedAt: '2026-09-24T10:00:00.000Z',
    subtotal: 30,
    iva: 4,
    total: 34,
  };
  const cancelled = {
    id: 'ft-cancelled',
    fiscalDocumentType: 'FT',
    status: 'CANCELLED',
    issuedAt: '2026-09-25T10:00:00.000Z',
    subtotal: 900,
    iva: 126,
    total: 1026,
  };

  const report = prepareFiscalReportDocuments(
    [ft, nc, nd, cancelled],
    2026,
  );

  assert.deepEqual(
    report.documentsForTotals.map((document) => document.id),
    ['ft-1', 'nc-1', 'nd-1'],
  );
  assert.deepEqual(
    report.cancelledDocuments.map((document) => document.id),
    ['ft-cancelled'],
  );
  assert.deepEqual(report.totals, {
    subtotal: 110,
    iva: 15,
    total: 125,
  });
});

test('conserva uma unica entrada quando a consulta fiscal devolve o mesmo documento', () => {
  const document = { id: 'ft-1', fiscalDocumentType: 'FT' };

  assert.deepEqual(uniqueFiscalDocuments([[document], [document]]), [document]);
});
