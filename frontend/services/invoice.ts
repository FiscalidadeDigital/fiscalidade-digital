import api from './api';

export type InvoiceItemInput = {
  productName: string;
  quantity: number;
  unitPrice: number;
};

export type CreateInvoiceInput = {
  clientId: string;
  notes?: string;
  items: InvoiceItemInput[];
};

export async function createInvoice(
  data: CreateInvoiceInput,
) {
  const response = await api.post(
    '/invoice',
    data,
  );

  return response.data;
}

export async function getInvoices() {
  const response = await api.get(
    '/invoice',
  );

  return response.data;
}

export async function getInvoice(
  id: string,
) {
  const response = await api.get(
    `/invoice/${id}`,
  );

  return response.data;
}

export async function markInvoicePaid(
  id: string,
) {
  const response = await api.patch(
    `/invoice/${id}/pay`,
  );

  return response.data;
}

export async function cancelInvoice(
  id: string,
) {
  const response = await api.patch(
    `/invoice/${id}/cancel`,
  );

  return response.data;
}

export async function getInvoiceDashboardStats() {
  const response = await api.get(
    '/invoice/dashboard/stats',
  );

  return response.data;
}

export function openInvoicePdf(
  id: string,
) {
  void api
    .get(
      `/invoice/${id}/pdf`,
      {
        responseType: 'blob',
      },
    )
    .then((response) => {
      const blob = new Blob(
        [response.data],
        {
          type: 'application/pdf',
        },
      );

      const blobUrl =
        URL.createObjectURL(
          blob,
        );

      const newWindow =
        window.open(
          blobUrl,
          '_blank',
        );

      if (!newWindow) {
        alert(
          'O navegador bloqueou a abertura do PDF. Permita pop-ups para este sistema.',
        );
      }

      setTimeout(() => {
        URL.revokeObjectURL(
          blobUrl,
        );
      }, 60_000);
    })
    .catch((error) => {
      console.error(
        'Erro ao abrir PDF:',
        error,
      );

      alert(
        'Não foi possível abrir o PDF da factura.',
      );
    });
}