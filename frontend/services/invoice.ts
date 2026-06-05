import api from './api';

export async function createInvoice(
  data: any,
) {
  const response =
    await api.post(
      '/invoice',
      data,
    );

  return response.data;
}

export async function getInvoices() {
  const response =
    await api.get('/invoice');

  return response.data;
}

export async function markInvoicePaid(
  id: string,
) {
  const response =
    await api.patch(
      `/invoice/${id}/pay`,
    );

  return response.data;
}

export async function cancelInvoice(
  id: string,
) {
  const response =
    await api.patch(
      `/invoice/${id}/cancel`,
    );

  return response.data;
}

export function openInvoicePdf(
  id: string,
) {
  window.open(
    `http://localhost:3001/invoice/${id}/pdf`,
    '_blank',
  );
}