import { AuthService } from './auth.service';

describe('AuthService registration defaults', () => {
  it('does not infer a withholding rate from the company category', async () => {
    const tenantCreate = jest.fn(({ data }) =>
      Promise.resolve({ id: 'tenant-1', ...data }),
    );
    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'user-1',
          tenantId: 'tenant-1',
          name: 'Responsável',
          email: 'owner@example.invalid',
          role: 'OWNER',
        }),
      },
      tenant: { create: tenantCreate },
      companySettings: {
        upsert: jest.fn().mockResolvedValue({ tenantId: 'tenant-1' }),
      },
    };
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('test-token'),
    };
    const obligationsService = {
      syncCompany: jest.fn().mockResolvedValue({
        success: true,
        created: 0,
        updated: 0,
        late: 0,
        year: 2026,
        calendarRules: 0,
      }),
    };
    const service = new AuthService(
      prisma as any,
      jwtService as any,
      obligationsService as any,
    );

    await service.register({
      companyName: 'Empresa de teste',
      ownerName: 'Responsável',
      nif: '5000000000',
      email: 'owner@example.invalid',
      companyType: 'OUTRO',
      employees: 0,
      regime: 'GERAL',
      password: 'Password-de-teste-2026!',
      acceptTerms: true,
      acceptPrivacyPolicy: true,
      confirmInformation: true,
    });

    const tenantData = tenantCreate.mock.calls[0][0].data;
    expect(tenantData.regime).toBe('GERAL');
    expect(tenantData).not.toHaveProperty('retentionRate');
  });
});
