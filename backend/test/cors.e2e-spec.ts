import { Controller, Get, INestApplication, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { createCorsOptions } from '../src/common/config/cors.config';

@Controller('cors-probe')
class CorsProbeController {
  @Get()
  getProbe() {
    return { ok: true };
  }
}

@Module({ controllers: [CorsProbeController] })
class CorsProbeModule {}

describe('production CORS origins', () => {
  let app: INestApplication;
  const officialVercelOrigin = 'https://fiscalidade-digital-o5ex.vercel.app';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CorsProbeModule],
    }).compile();

    app = moduleRef.createNestApplication({ logger: false });
    app.enableCors(createCorsOptions());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('accepts the official Vercel origin on OPTIONS preflight', async () => {
    await request(app.getHttpServer())
      .options('/cors-probe')
      .set('Origin', officialVercelOrigin)
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'authorization,content-type')
      .expect(204)
      .expect('Access-Control-Allow-Origin', officialVercelOrigin)
      .expect('Access-Control-Allow-Credentials', 'true');
  });

  it('accepts requests from the official Vercel origin', async () => {
    await request(app.getHttpServer())
      .get('/cors-probe')
      .set('Origin', officialVercelOrigin)
      .expect(200)
      .expect('Access-Control-Allow-Origin', officialVercelOrigin)
      .expect({ ok: true });
  });
});
