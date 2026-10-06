import { redirect } from 'next/navigation';

export default function LegacyInvoicePage() {
  redirect('/invoices');
}
