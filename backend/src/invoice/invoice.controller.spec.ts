import { UserRole } from '@prisma/client';

import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';

describe('InvoiceController tenant paging', () => {
  const service = {
    findPage: jest.fn(),
    findAll: jest.fn(),
    createCreditNote: jest.fn(),
    createDebitNote: jest.fn(),
    validateCreditNote: jest.fn(),
    validateDebitNote: jest.fn(),
  };
  const controller = new InvoiceController(
    service as unknown as InvoiceService,
  );
  const user: CurrentUserPayload = {
    userId: 'owner-a',
    tenantId: 'tenant-a',
    email: 'owner@example.test',
    role: UserRole.OWNER,
  };

  beforeEach(() => jest.clearAllMocks());

  it('uses the authenticated tenant for paged list requests', async () => {
    await controller.findAll(user, {
      search: 'FT-2026',
      status: 'PENDING',
      page: 1,
      pageSize: 20,
      sortBy: 'issuedAt',
      sortDirection: 'desc',
    });

    expect(service.findPage).toHaveBeenCalledWith(
      'tenant-a',
      expect.objectContaining({ page: 1, status: 'PENDING' }),
    );
  });

  it('runs note validation in the authenticated tenant', async () => {
    const dto = {
      operationId: '30c97192-45d0-4eaa-859c-043c711d9d22',
      sourceInvoiceId: 'd0e5f8f5-3d89-43b1-ad30-cdc11fc26f0c',
      reason: 'Devolução parcial',
      items: [
        {
          sourceInvoiceItemId: 'e9a2f6a1-50cb-4c71-87cb-4199f4a058bc',
          quantity: 1,
        },
      ],
    };

    await Promise.all([
      controller.validateCreditNote(user, dto),
      controller.validateDebitNote(user, dto),
    ]);

    expect(service.validateCreditNote).toHaveBeenCalledWith('tenant-a', dto);
    expect(service.validateDebitNote).toHaveBeenCalledWith('tenant-a', dto);
  });

  it('associates the authenticated user with each note issuance', async () => {
    const dto = {
      operationId: '4ec352df-1014-47f2-9ea2-2d0258595c1a',
      sourceInvoiceId: 'd0e5f8f5-3d89-43b1-ad30-cdc11fc26f0c',
      reason: 'Acerto comercial',
      items: [
        {
          sourceInvoiceItemId: 'e9a2f6a1-50cb-4c71-87cb-4199f4a058bc',
          quantity: 1,
          unitPrice: 125,
        },
      ],
    };

    await Promise.all([
      controller.createCreditNote(user, dto),
      controller.createDebitNote(user, dto),
    ]);

    expect(service.createCreditNote).toHaveBeenCalledWith(
      'tenant-a',
      dto,
      'owner-a',
    );
    expect(service.createDebitNote).toHaveBeenCalledWith(
      'tenant-a',
      dto,
      'owner-a',
    );
  });
});
