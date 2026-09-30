import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../src/notifications/notifications.service';

describe('Notifications tenant isolation', () => {
  const prisma = {
    notification: {
      findFirst: jest.fn(),
    },
  } as any;
  const service = new NotificationsService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.notification.findFirst.mockResolvedValue(null);
  });

  it.each([
    ['findOne', (tenantId: string) => service.findOne(tenantId, 'notification-1')],
    ['markAsRead', (tenantId: string) => service.markAsRead(tenantId, 'notification-1')],
    ['remove', (tenantId: string) => service.remove(tenantId, 'notification-1')],
  ])('%s scopes its lookup to the authenticated tenant', async (_method, action) => {
    await expect(action('tenant-b')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.notification.findFirst).toHaveBeenCalledWith({
      where: { id: 'notification-1', tenantId: 'tenant-b' },
    });
  });
});
