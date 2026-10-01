import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseInvoiceController } from './purchase-invoice.controller';
import { PurchaseInvoiceService } from './purchase-invoice.service';
import { UserRole } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreatePurchaseInvoiceDto } from './dto/create-purchase-invoice.dto';
import { UpdatePurchaseInvoiceDto } from './dto/update-purchase-invoice.dto';
import { UpdatePurchaseInvoiceVatDeductibilityDto } from './dto/update-purchase-invoice-vat-deductibility.dto';
import { REQUIRED_ROLES_KEY } from '../common/decorators/roles.decorator';

describe('PurchaseInvoiceController', () => {
  let controller: PurchaseInvoiceController;
  const service = {
    create: jest.fn(),
    update: jest.fn(),
    updateVatDeductibility: jest.fn(),
    validate: jest.fn(),
    reject: jest.fn(),
    addPayment: jest.fn(),
    cancel: jest.fn(),
    remove: jest.fn(),
  } as unknown as PurchaseInvoiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseInvoiceController],
      providers: [{ provide: PurchaseInvoiceService, useValue: service }],
    }).compile();

    controller = module.get<PurchaseInvoiceController>(PurchaseInvoiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('uses the authenticated tenant and explicit roles for write operations', () => {
    const dto = {} as CreatePurchaseInvoiceDto;
    controller.create({ tenantId: 'tenant-a', userId: 'user-a' }, dto);
    controller.update({ tenantId: 'tenant-a' }, 'invoice-1', {} as UpdatePurchaseInvoiceDto);
    const review = { status: 'DEDUCTIBLE', reason: 'Documento validado.' } as UpdatePurchaseInvoiceVatDeductibilityDto;
    controller.updateVatDeductibility({ tenantId: 'tenant-a', userId: 'user-a' }, 'invoice-1', review);

    expect(service.create).toHaveBeenCalledWith('tenant-a', 'user-a', dto);
    expect(service.update).toHaveBeenCalledWith('tenant-a', 'invoice-1', {});
    expect(service.updateVatDeductibility).toHaveBeenCalledWith('tenant-a', 'user-a', 'invoice-1', review);
    expect(Reflect.getMetadata(REQUIRED_ROLES_KEY, PurchaseInvoiceController.prototype.updateVatDeductibility))
      .toEqual([UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT]);
    expect(Reflect.getMetadata(REQUIRED_ROLES_KEY, PurchaseInvoiceController.prototype.create))
      .toEqual([UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT]);
    expect(Reflect.getMetadata(REQUIRED_ROLES_KEY, PurchaseInvoiceController.prototype.addPayment))
      .toEqual([UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT]);
    expect(Reflect.getMetadata(REQUIRED_ROLES_KEY, PurchaseInvoiceController.prototype.cancel))
      .toEqual([UserRole.OWNER, UserRole.ADMIN]);
    expect(Reflect.getMetadata(REQUIRED_ROLES_KEY, PurchaseInvoiceController.prototype.remove))
      .toEqual([UserRole.OWNER, UserRole.ADMIN]);
  });

  it('accepts valid invoice input and rejects malformed dates and empty item lists', async () => {
    const valid = plainToInstance(CreatePurchaseInvoiceDto, {
      supplierId: 'supplier-id',
      invoiceNumber: 'FT-001',
      issuedAt: '2026-09-01',
      iva: '140.00',
      withholdingTax: '0',
      items: [{ productName: 'Serviço', quantity: '1', unitPrice: '1000.00' }],
    });
    const invalid = plainToInstance(CreatePurchaseInvoiceDto, {
      supplierId: 'supplier-id',
      invoiceNumber: 'FT-001',
      issuedAt: 'not-a-date',
      iva: '0',
      withholdingTax: '0',
      items: [],
    });

    expect(await validate(valid)).toHaveLength(0);
    expect(await validate(invalid)).not.toHaveLength(0);
  });

  it('rejects invalid updated monetary values and empty replacement items', async () => {
    const invalid = plainToInstance(UpdatePurchaseInvoiceDto, {
      iva: '-1',
      items: [],
    });

    expect(await validate(invalid)).not.toHaveLength(0);
  });

  it('accepts only explicit VAT review states', async () => {
    const valid = plainToInstance(UpdatePurchaseInvoiceVatDeductibilityDto, {
      status: 'DEDUCTIBLE',
      reason: 'Documento validado.',
    });
    const invalid = plainToInstance(UpdatePurchaseInvoiceVatDeductibilityDto, {
      status: 'OCR_APPROVED',
    });

    expect(await validate(valid)).toHaveLength(0);
    expect(await validate(invalid)).not.toHaveLength(0);
  });
});
