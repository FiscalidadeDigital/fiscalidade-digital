function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getFiscalDocumentDate(document) {
  return document?.issuedAt ?? document?.issueDate ?? document?.createdAt;
}

function getFiscalDocumentSign(document) {
  return document?.fiscalDocumentType === 'NC' ? -1 : 1;
}

function isCancelledFiscalDocument(document) {
  return document?.status === 'CANCELLED';
}

function prepareFiscalReportDocuments(documents, year) {
  const sourceDocuments = Array.isArray(documents)
    ? documents.filter((document) => {
        const dateValue = getFiscalDocumentDate(document);
        const date = dateValue ? new Date(dateValue) : null;

        return date && !Number.isNaN(date.getTime()) && date.getFullYear() === year;
      })
    : [];
  const documentsForTotals = sourceDocuments.filter(
    (document) => !isCancelledFiscalDocument(document),
  );
  const cancelledDocuments = sourceDocuments.filter(isCancelledFiscalDocument);
  const totalFor = (field) =>
    documentsForTotals.reduce(
      (total, document) =>
        total + getFiscalDocumentSign(document) * numberValue(document?.[field]),
      0,
    );

  return {
    sourceDocuments,
    documentsForTotals,
    cancelledDocuments,
    totals: {
      subtotal: totalFor('subtotal'),
      iva: totalFor('iva'),
      total: totalFor('total'),
    },
  };
}

function uniqueFiscalDocuments(groups) {
  const documentsById = new Map();

  for (const group of groups) {
    if (!Array.isArray(group)) continue;

    for (const document of group) {
      if (!document?.id || documentsById.has(document.id)) continue;
      documentsById.set(document.id, document);
    }
  }

  return Array.from(documentsById.values());
}

module.exports = {
  getFiscalDocumentDate,
  getFiscalDocumentSign,
  isCancelledFiscalDocument,
  prepareFiscalReportDocuments,
  uniqueFiscalDocuments,
};
