const MAX_RECOVERY_DOCUMENTS = 100;

function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function expectedItemsOnPage(page) {
  const pagination = page?.pagination;
  const total = Number(pagination?.total);
  if (!Number.isInteger(total) || total < 0) return 0;

  const currentPage = positiveInteger(pagination?.page, 1);
  const pageSize = positiveInteger(pagination?.pageSize, 20);
  return Math.max(0, Math.min(pageSize, total - (currentPage - 1) * pageSize));
}

function invoicePageNeedsRecovery(page) {
  return (
    Array.isArray(page?.data) &&
    page.data.length < expectedItemsOnPage(page) &&
    Number(page.pagination?.total) <= MAX_RECOVERY_DOCUMENTS
  );
}

function normalized(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('pt-AO');
}

function amount(invoice) {
  return Number(invoice.totalAmount ?? invoice.total ?? 0);
}

function dateValue(invoice) {
  const value = new Date(invoice.issuedAt).getTime();
  return Number.isFinite(value) ? value : 0;
}

function matchesQuery(invoice, query) {
  if (query.documentType && invoice.documentType !== query.documentType) {
    return false;
  }
  if (
    query.fiscalDocumentType &&
    (invoice.fiscalDocumentType ?? 'FT') !== query.fiscalDocumentType
  ) {
    return false;
  }
  if (query.status && invoice.status !== query.status) return false;

  const search = normalized(query.search);
  if (!search) return true;

  return [
    invoice.invoiceNumber,
    invoice.client?.name,
    invoice.client?.nif,
  ].some((value) => normalized(value).includes(search));
}

function compareInvoices(left, right, sortBy) {
  if (sortBy === 'total') return amount(left) - amount(right);
  if (sortBy === 'invoiceNumber') {
    return String(left.invoiceNumber ?? '').localeCompare(
      String(right.invoiceNumber ?? ''),
      'pt-AO',
    );
  }
  return dateValue(left) - dateValue(right);
}

function recoverInvoicePage(page, collection, query) {
  if (!invoicePageNeedsRecovery(page) || !Array.isArray(collection)) {
    return page;
  }

  const documents = collection.filter((invoice) =>
    matchesQuery(invoice, query),
  );
  const reportedTotal = Number(page.pagination.total);
  if (documents.length !== reportedTotal) return page;

  const sortBy = query.sortBy ?? 'issuedAt';
  const direction = query.sortDirection === 'asc' ? 1 : -1;
  documents.sort(
    (left, right) => direction * compareInvoices(left, right, sortBy),
  );

  const currentPage = positiveInteger(query.page, page.pagination.page);
  const pageSize = positiveInteger(query.pageSize, page.pagination.pageSize);
  const offset = (currentPage - 1) * pageSize;
  const data = documents.slice(offset, offset + pageSize);
  if (data.length < expectedItemsOnPage(page)) return page;

  return {
    ...page,
    data,
    pagination: {
      ...page.pagination,
      page: currentPage,
      pageSize,
      total: documents.length,
      totalPages: Math.max(1, Math.ceil(documents.length / pageSize)),
    },
  };
}

module.exports = {
  invoicePageNeedsRecovery,
  recoverInvoicePage,
};
