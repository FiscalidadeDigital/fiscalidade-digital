import { AlertsService } from './alerts.service';

describe('AlertsService manual checks', () => {
  const prisma = {
    fiscalObligation: {
      findMany: jest.fn(),
    },
  } as any;
  const service = new AlertsService(prisma, {} as any, {} as any);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.fiscalObligation.findMany.mockResolvedValue([]);
  });

  it('limits a manual check to the authenticated tenant', async () => {
    await expect(service.runManualCheck('tenant-a')).resolves.toEqual({
      success: true,
      message: expect.any(String),
      processed: 0,
    });

    expect(prisma.fiscalObligation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-a' }),
      }),
    );
  });
});
