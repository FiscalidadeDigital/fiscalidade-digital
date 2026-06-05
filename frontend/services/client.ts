import api from './api';

export async function getClients() {
  const response =
    await api.get('/clients');

  return response.data;
}