import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseInvoiceController } from './purchase-invoice.controller';

describe('PurchaseInvoiceController', () => {
  let controller: PurchaseInvoiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseInvoiceController],
    }).compile();

    controller = module.get<PurchaseInvoiceController>(PurchaseInvoiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
