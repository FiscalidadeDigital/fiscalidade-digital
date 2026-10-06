import { AuthService } from './auth.service';

describe('AuthService registration', () => {
  it('creates a pending account and versioned consents without creating a tenant', async () => {
    const transaction = {
      pendingRegistration: { create: jest.fn().mockResolvedValue({ id: 'pending-1', name: 'Responsável', email: 'owner@example.invalid' }) },
      legalAcceptance: { createMany: jest.fn().mockResolvedValue({ count: 2 }) },
    };
    const prisma = {
      user: { findFirst: jest.fn().mockResolvedValue(null) },
      pendingRegistration: { findUnique: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn((callback) => callback(transaction)),
      authChallenge: { findFirst: jest.fn().mockResolvedValue(null), updateMany: jest.fn().mockResolvedValue({ count: 0 }), create: jest.fn().mockResolvedValue({}) },
    };
    const mail = { sendEmailVerification: jest.fn() };
    const service = new AuthService(prisma as any, {} as any, mail as any, {} as any);

    await service.registerAccount({
      name: 'Responsável', email: 'owner@example.invalid', password: 'Password-de-teste-2026!',
      confirmPassword: 'Password-de-teste-2026!', acceptTerms: true, acceptPrivacyPolicy: true,
    });

    expect(transaction.legalAcceptance.createMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.arrayContaining([
        expect.objectContaining({ documentType: 'TERMS_OF_USE' }),
        expect.objectContaining({ documentType: 'PRIVACY_POLICY' }),
      ]),
    }));
    expect((prisma as any).tenant).toBeUndefined();
    expect(mail.sendEmailVerification).toHaveBeenCalledWith(
      'owner@example.invalid', 'Responsável', expect.stringMatching(/^\d{6}$/),
    );
  });
});

describe('AuthService authentication challenges', () => {
  const makeService = (challenge: any, updateCount = 1) => {
    const prisma = {
      authChallenge: { findFirst: jest.fn().mockResolvedValue(challenge), updateMany: jest.fn().mockResolvedValue({ count: updateCount }) },
    };
    return { service: new AuthService(prisma as any, {} as any, {} as any, {} as any), prisma };
  };

  it('rejects a wrong OTP and increments its attempt counter', async () => {
    const { service, prisma } = makeService({ id: 'challenge-1', codeHash: 'not-the-code', expiresAt: new Date(Date.now() + 60_000), attemptCount: 0, usedAt: null });
    await expect((service as any).consumeChallenge('a@example.invalid', 'EMAIL_VERIFICATION', '123456')).rejects.toThrow('inválido ou expirou');
    expect(prisma.authChallenge.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { attemptCount: { increment: 1 } } }));
  });

  it('rejects an expired OTP without consuming it', async () => {
    const { service, prisma } = makeService({ id: 'challenge-1', codeHash: 'irrelevant', expiresAt: new Date(Date.now() - 1), attemptCount: 0, usedAt: null });
    await expect((service as any).consumeChallenge('a@example.invalid', 'EMAIL_VERIFICATION', '123456')).rejects.toThrow('inválido ou expirou');
    expect(prisma.authChallenge.updateMany).not.toHaveBeenCalled();
  });

  it('rejects an OTP claimed concurrently by another request', async () => {
    const crypto = require('crypto');
    const { service } = makeService({ id: 'challenge-1', codeHash: crypto.createHash('sha256').update('123456').digest('hex'), expiresAt: new Date(Date.now() + 60_000), attemptCount: 0, usedAt: null }, 0);
    await expect((service as any).consumeChallenge('a@example.invalid', 'EMAIL_VERIFICATION', '123456')).rejects.toThrow('inválido ou expirou');
  });
});
