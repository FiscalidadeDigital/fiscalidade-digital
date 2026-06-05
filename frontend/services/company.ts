import api from './api';

export async function getCompany() {
  const response =
    await api.get('/company');

  return response.data;
}

export async function updateCompany(
  data: any,
) {
  const response =
    await api.patch(
      '/company',
      data,
    );

  return response.data;
}