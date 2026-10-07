import 'reflect-metadata';
import { UserRole } from '@prisma/client';
import { REQUIRED_ROLES_KEY } from '../common/decorators/roles.decorator';
import { AiController } from './ai.controller';

describe('AiController authorization boundary', () => {
  it('allows only authenticated tenant roles', () => {
    expect(
      Reflect.getMetadata(REQUIRED_ROLES_KEY, AiController.prototype.chat),
    ).toEqual([
      UserRole.OWNER,
      UserRole.ADMIN,
      UserRole.ACCOUNTANT,
      UserRole.VIEWER,
    ]);
  });

  it('uses tenant and user identity exclusively from the JWT request', async () => {
    const aiService = { chat: jest.fn().mockResolvedValue({ answer: 'ok' }) };
    const controller = new AiController(aiService as never);

    await controller.chat(
      { user: { tenantId: 'tenant-from-jwt', userId: 'user-from-jwt' } },
      { message: 'Quais são os meus prazos?' },
    );

    expect(aiService.chat).toHaveBeenCalledWith(
      'tenant-from-jwt',
      'user-from-jwt',
      'Quais são os meus prazos?',
    );
  });
});
