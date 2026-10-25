import { Controller, Get, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import { createCorsConfig } from '../src/common/config/cors.config';

@Controller()
class ProbeController {
  @Get('probe') probe() { return { ok: true }; }
}
@Module({ controllers: [ProbeController] })
class ProbeModule {}

describe('CORS HTTP policy', () => {
  let app: INestApplication;
  let url: string;
  beforeAll(async () => {
    app = await NestFactory.create(ProbeModule, { logger: false });
    app.enableCors(createCorsConfig({}).options);
    await app.listen(0, '127.0.0.1');
    url = await app.getUrl();
  });
  afterAll(async () => { await app?.close(); });
  it('accepts the official frontend preflight with credentials and auth headers', async () => {
    const origin = 'https://fiscalidade-digital-o5ex.vercel.app';
    const response = await fetch(`${url}/probe`, { method: 'OPTIONS', headers: {
      Origin: origin, 'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'authorization,content-type',
    } });
    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe(origin);
    expect(response.headers.get('access-control-allow-credentials')).toBe('true');
    expect(response.headers.get('access-control-allow-headers')?.toLowerCase()).toContain('authorization');
  });
  it.each(['https://fiscalidadedigital.ao', 'https://www.fiscalidadedigital.ao', 'http://localhost:3000'])('preserves %s', async (origin) => {
    const response = await fetch(`${url}/probe`, { headers: { Origin: origin } });
    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe(origin);
  });
  it('withholds CORS permission from lookalike origins without a server error', async () => {
    const response = await fetch(`${url}/probe`, { method: 'OPTIONS', headers: {
      Origin: 'https://fiscalidade-digital-o5ex.vercel.app.attacker.example',
      'Access-Control-Request-Method': 'GET',
    } });
    expect(response.status).toBeLessThan(500);
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });
  it('preserves requests without Origin', async () => {
    expect((await fetch(`${url}/probe`)).status).toBe(200);
  });
  it('includes configured environment origins with exact matching', () => {
    expect(createCorsConfig({ FRONTEND_URLS: ' https://example.test,https://example.test ' }).configuredOrigins.filter(x => x === 'https://example.test')).toHaveLength(1);
  });
});
