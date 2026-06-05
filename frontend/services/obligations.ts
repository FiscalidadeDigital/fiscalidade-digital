import api from './api';


export const getObligations = async () => {
  const response =
    await api.get('/obligations');

  return response.data;
  
};

export const getDashboard = async () => {
  const response =
    await api.get('/obligations/dashboard');

  return response.data;
};

export const payObligation = async (
  id: string,
) => {
  const response = await api.patch(
    `/obligations/${id}/pay`,
  );

  return response.data;
};
