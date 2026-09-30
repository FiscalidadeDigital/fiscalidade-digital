import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseInvoiceService } from './purchase-invoice.service';
import { ObligationsService } from '../obligations/obligations.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PurchaseInvoiceService', () => {
  let service: PurchaseInvoiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseInvoiceService,
        { provide: PrismaService, useValue: {} },
        { provide: ObligationsService, useValue: {} },
      ],
    }).compile();

    service = module.get<PurchaseInvoiceService>(PurchaseInvoiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
