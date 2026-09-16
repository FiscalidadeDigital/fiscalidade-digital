import api from './api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;

  notificationType?:
    | 'INFO'
    | 'WARNING'
    | 'SUCCESS'
    | 'ERROR'
    | string;
}

// =====================================================
// LISTAR NOTIFICAÇÕES
// =====================================================

export async function getNotifications() {
  const response =
    await api.get('/notifications');

  return response.data;
}

// =====================================================
// LISTAR NÃO LIDAS
// =====================================================

export async function getUnreadNotifications() {
  const response =
    await api.get(
      '/notifications/unread',
    );

  return response.data;
}

// =====================================================
// CONTAR NÃO LIDAS
// =====================================================

export async function getUnreadNotificationCount() {
  const response =
    await api.get(
      '/notifications/unread/count',
    );

  return response.data;
}

// =====================================================
// OBTER UMA NOTIFICAÇÃO
// =====================================================

export async function getNotification(
  id: string,
) {
  const response =
    await api.get(
      `/notifications/${id}`,
    );

  return response.data;
}

// =====================================================
// MARCAR UMA COMO LIDA
// =====================================================

export async function markAsRead(
  id: string,
) {
  const response =
    await api.patch(
      `/notifications/${id}/read`,
    );

  return response.data;
}

// =====================================================
// MARCAR TODAS COMO LIDAS
// =====================================================

export async function markAllAsRead() {
  const response =
    await api.patch(
      '/notifications/read-all',
    );

  return response.data;
}