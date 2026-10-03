import { CompanyService } from './company.service';

describe('CompanyService city', () => {
  const tenant = {
    id: 'tenant-a',
    name: 'Empresa A',
    nif: '5000000001',
    email: 'empresa@example.ao',
    city: 'Luanda',
    companyType: 'SINGLE',
  };

  function setup() {
    const prisma = {
      tenant: {
        findUnique: jest.fn().mockResolvedValue(tenant),
        update: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ ...tenant, ...data }),
        ),
      },
    };
    return { prisma, service: new CompanyService(prisma as any) };
  }

  it('devolve city na leitura da empresa autenticada', async () => {
    const { prisma, service } = setup();

    await expect(service.getCompany('tenant-a')).resolves.toMatchObject({ city: 'Luanda' });
    expect(prisma.tenant.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'tenant-a' }, select: expect.objectContaining({ city: true }) }),
    );
  });

  it('normaliza e persiste city apenas no tenant autenticado', async () => {
    const { prisma, service } = setup();

    await service.updateCompany('tenant-a', { city: '  Benguela  ' });

    expect(prisma.tenant.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'tenant-a' }, data: expect.objectContaining({ city: 'Benguela' }) }),
    );
    expect(prisma.tenant.update.mock.calls[0][0].data.companyType).toBeUndefined();
  });

  it('mantém compatibilidade com pedidos antigos sem city', async () => {
    const { prisma, service } = setup();

    await service.updateCompany('tenant-a', { phone: '+244 900 000 000' });

    expect(prisma.tenant.update.mock.calls[0][0].data.city).toBeUndefined();
  });

  it('converte uma city vazia após trim em null', async () => {
    const { prisma, service } = setup();

    await service.updateCompany('tenant-a', { city: '   ' });

    expect(prisma.tenant.update.mock.calls[0][0].data.city).toBeNull();
  });
});
