import { APP_GUARD } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';

import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';

jest.setTimeout(60_000);

describe('Auth register throttling behind the trusted proxy', () => {
  const body = (suffix: string) => ({
    name: 'Utilizador de auditoria',
    email: `audit-${suffix}@example.test`,
    password: 'Password-Audit-2026!',
    confirmPassword: 'Password-Audit-2026!',
    acceptTerms: true,
    acceptPrivacyPolicy: true,
  });

  async function createApp() {
    const auth = {
      registerAccount: jest.fn(async (dto: { email?: string }) => ({ email: dto.email })),
      verifyEmail: jest.fn(),
      resendVerification: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      completeOnboarding: jest.fn(),
      createInvitation: jest.fn(),
      acceptInvitation: jest.fn(),
      login: jest.fn(),
      getCurrentUser: jest.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }])],
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: APP_GUARD, useClass: ThrottlerGuard },
      ],
    }).compile();
    const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
    app.set('trust proxy', 1);
    app.enableCors({ origin: true });
    await app.init();
    return app;
  }

  it('does not share the register bucket between forwarded client IPs', async () => {
    const app = await createApp();
    try {
      for (let attempt = 1; attempt <= 4; attempt += 1) {
        await request(app.getHttpServer())
          .post('/auth/register')
          .set('X-Forwarded-For', `198.51.100.${attempt}`)
          .send(body(`distinct-${attempt}`))
          .expect(201);
      }
    } finally {
      await app.close();
    }
  });

  it('returns 429 on the fourth register request from the same client IP', async () => {
    const app = await createApp();
    try {
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        await request(app.getHttpServer())
          .post('/auth/register')
          .set('X-Forwarded-For', '192.0.2.10')
          .send(body(`abuse-${attempt}`))
          .expect(201);
      }
      await request(app.getHttpServer())
        .post('/auth/register')
        .set('X-Forwarded-For', '192.0.2.10')
        .send(body('abuse-4'))
        .expect(429);
    } finally {
      await app.close();
    }
  });

  it('does not consume the register bucket for a CORS preflight', async () => {
    const app = await createApp();
    try {
      await request(app.getHttpServer())
        .options('/auth/register')
        .set('Origin', 'https://fiscalidadedigital.ao')
        .set('Access-Control-Request-Method', 'POST')
        .set('X-Forwarded-For', '203.0.113.20')
        .expect(204);
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        await request(app.getHttpServer())
          .post('/auth/register')
          .set('X-Forwarded-For', '203.0.113.20')
          .send(body(`preflight-${attempt}`))
          .expect(201);
      }
    } finally {
      await app.close();
    }
  });
});
