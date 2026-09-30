import { UserRole } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { REQUIRED_ROLES_KEY } from '../common/decorators/roles.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { SearchProductsDto } from './dto/search-products.dto';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

describe('ProductController authorization and DTOs', () => {
  const productService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findPage: jest.fn(),
    search: jest.fn(),
    count: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as ProductService;
  const controller = new ProductController(productService);
  const owner: CurrentUserPayload = {
    userId: 'owner-a',
    tenantId: 'tenant-a',
    email: 'owner@example.test',
    role: UserRole.OWNER,
  };

  beforeEach(() => jest.clearAllMocks());

  it('derives tenant scope from the authenticated principal', async () => {
    await controller.create(owner, { name: 'Consultoria', price: 1000, unit: 'SERVICO' });
    await controller.findAll(owner, { page: 1, pageSize: 20 });
    await controller.update(owner, 'product-1', { price: 1200 });

    expect(productService.create).toHaveBeenCalledWith(
      'tenant-a',
      expect.objectContaining({ name: 'Consultoria' }),
    );
    expect(productService.findPage).toHaveBeenCalledWith(
      'tenant-a',
      expect.objectContaining({ page: 1 }),
    );
    expect(productService.update).toHaveBeenCalledWith(
      'tenant-a',
      'product-1',
      { price: 1200 },
    );
  });

  it('reserves deletion for owners and administrators', () => {
    expect(
      Reflect.getMetadata(REQUIRED_ROLES_KEY, ProductController.prototype.remove),
    ).toEqual([UserRole.OWNER, UserRole.ADMIN]);
  });

  it('accepts supported units and rejects unknown values', async () => {
    const valid = plainToInstance(CreateProductDto, {
      name: 'Horas de consultoria',
      price: 25000,
      unit: 'HORA',
    });
    const invalid = plainToInstance(CreateProductDto, {
      name: 'Produto',
      price: 100,
      unit: 'CAIXA_INVENTADA',
    });

    expect(await validate(valid)).toHaveLength(0);
    expect(await validate(invalid)).not.toHaveLength(0);
  });

  it('validates paging and sorting inputs', async () => {
    const valid = plainToInstance(SearchProductsDto, {
      page: '2',
      pageSize: '20',
      sortBy: 'price',
      sortDirection: 'desc',
    });
    const invalid = plainToInstance(SearchProductsDto, {
      page: 0,
      pageSize: 1000,
      sortBy: 'tenantId',
    });

    expect(await validate(valid)).toHaveLength(0);
    expect(await validate(invalid)).not.toHaveLength(0);
  });
});
