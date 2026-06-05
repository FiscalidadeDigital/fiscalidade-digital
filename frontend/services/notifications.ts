import api from './api';

export const getNotifications =
  async () => {
    const response =
      await api.get('/notifications');

    return response.data;
  };

export const markAsRead = async (
  id: string,
) => {
  const response = await api.patch(
    `/notifications/${id}/read`,
  );

  return response.data;
};