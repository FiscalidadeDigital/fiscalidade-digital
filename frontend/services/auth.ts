import api from './api';
import { removeToken, saveToken } from '@/lib/auth';

export const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (data: {
  companyName: string;
  ownerName: string;
  nif: string;
  email: string;
  phone?: string;
  address?: string;
  sector?: string;
  companyType?: string;
  employees?: number;
  regime?: string;
  password: string;
}) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

export const logout = () => {
  removeToken();
};