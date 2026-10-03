import api from './api';

export interface Client {
  id: string;
  name: string;
  nif: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getClients(): Promise<Client[]> {
  const response =
    await api.get<Client[]>('/clients');

  return response.data;
}
