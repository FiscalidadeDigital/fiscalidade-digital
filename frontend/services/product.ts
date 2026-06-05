import api from './api';

export async function getProducts() {
  const response =
    await api.get('/products');

  return response.data;
}

export async function createProduct(
  data: any,
) {
  const response =
    await api.post(
      '/products',
      data,
    );

  return response.data;
}

export async function deleteProduct(
  id: string,
) {
  const response =
    await api.delete(
      `/products/${id}`,
    );

  return response.data;
}