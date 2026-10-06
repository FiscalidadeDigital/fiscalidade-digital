import { UserRole } from '@prisma/client';
import { REQUIRED_ROLES_KEY } from '../common/decorators/roles.decorator';
import { ElectronicInvoicingController } from './electronic-invoicing.controller';

describe('ElectronicInvoicingController RBAC and tenant derivation', () => {
  const service: any = { list: jest.fn(), preflight: jest.fn(), localState: jest.fn(), submit: jest.fn(), queryStatus: jest.fn(), queryInvoice: jest.fn(), listSeries: jest.fn(), requestSeries: jest.fn(), readiness: jest.fn() };
  const controller = new ElectronicInvoicingController(service);

  it('passes the authenticated tenant to reads and writes', async () => {
    service.submit.mockResolvedValue({});
    await controller.submit({ tenantId: 'tenant-a' }, 'invoice-a');
    expect(service.submit).toHaveBeenCalledWith('tenant-a', 'invoice-a');
  });

  it('derives tenant scope for the read-only invoice state', async () => {
    service.localState.mockResolvedValue({ submissionStatus: 'NOT_SUBMITTED' });
    await controller.state({ tenantId: 'tenant-a' }, 'invoice-a');
    expect(service.localState).toHaveBeenCalledWith('tenant-a', 'invoice-a');
  });

  it('allows invoice transmission only to accounting write roles', () => {
    expect(Reflect.getMetadata(REQUIRED_ROLES_KEY, controller.submit)).toEqual([UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT]);
    expect(Reflect.getMetadata(REQUIRED_ROLES_KEY, controller.requestSeries)).toEqual([UserRole.OWNER, UserRole.ADMIN]);
  });
});
