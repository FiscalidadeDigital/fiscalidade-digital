/**
 * Rotas canónicas da Gestão de facturas.
 *
 * Esta lista é deliberadamente livre de React para que a navegação seja
 * verificável por testes Node e reutilizável pela sidebar e pelos módulos.
 */
const invoiceManagementItems = Object.freeze([
  {
    id: 'issued',
    href: '/invoices',
    label: 'Facturas emitidas',
    description: 'Documentos fiscais emitidos pela empresa',
  },
  {
    id: 'received',
    href: '/purchase-invoices',
    label: 'Facturas recebidas',
    description: 'Compras, revisão e documentos de fornecedores',
  },
  {
    id: 'pro-formas',
    href: '/pro-formas',
    label: 'Pro Formas',
    description: 'Propostas comerciais antes da factura definitiva',
  },
  {
    id: 'electronic',
    href: '/electronic-invoicing',
    label: 'Facturação electrónica',
    description: 'Preparação e acompanhamento técnico de submissões',
  },
]);

function pathnameOnly(pathname) {
  return String(pathname || '').split(/[?#]/, 1)[0] || '/';
}

function isInvoiceManagementPath(pathname) {
  const currentPath = pathnameOnly(pathname);

  return invoiceManagementItems.some(
    ({ href }) => currentPath === href || currentPath.startsWith(`${href}/`),
  );
}

function isInvoiceManagementItemActive(pathname, href) {
  const currentPath = pathnameOnly(pathname);

  return currentPath === href || currentPath.startsWith(`${href}/`);
}

module.exports = {
  invoiceManagementItems,
  isInvoiceManagementPath,
  isInvoiceManagementItemActive,
};
