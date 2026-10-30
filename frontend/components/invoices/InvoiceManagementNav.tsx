'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileInput,
  FileText,
  RadioTower,
  ReceiptText,
  type LucideIcon,
} from 'lucide-react';

import {
  invoiceManagementItems,
  isInvoiceManagementItemActive,
} from '@/lib/invoice-management';

const icons: Record<string, LucideIcon> = {
  issued: ReceiptText,
  received: FileInput,
  'pro-formas': FileText,
  electronic: RadioTower,
};

type InvoiceManagementNavProps = {
  className?: string;
};

/**
 * Navegação por rotas, e não tabs locais: cada módulo conserva o URL directo,
 * o histórico do navegador e a própria política de autorização no servidor.
 */
export default function InvoiceManagementNav({
  className = '',
}: InvoiceManagementNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Módulos de Gestão de facturas"
      className={`fd-invoice-management-nav ${className}`}
    >
      <div className="fd-invoice-management-nav__heading">
        <p>Gestão de facturas</p>
        <span>Seleccione o módulo que pretende consultar.</span>
      </div>
      <div className="fd-invoice-management-nav__list">
        {invoiceManagementItems.map((item) => {
          const Icon = icons[item.id];
          const active = isInvoiceManagementItemActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className="fd-invoice-management-nav__item"
            >
              <span className="fd-invoice-management-nav__icon" aria-hidden="true">
                <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
              </span>
              <span className="min-w-0">
                <span className="fd-invoice-management-nav__label">{item.label}</span>
                <span className="fd-invoice-management-nav__description">
                  {item.description}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
