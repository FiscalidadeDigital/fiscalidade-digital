import { BadRequestException, CanActivate, ExecutionContext, INestApplication, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccountingSaftController } from './accounting-saft.controller';
import { AccountingSaftService } from './accounting-saft.service';
import { SaftExportService } from '../saft/saft-export.service';

class TestJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const token = String(req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
    if (!['tenant-a', 'tenant-b'].includes(token)) throw new UnauthorizedException();
    req.user = { userId: `owner-${token}`, tenantId: token, email: `${token}@test.ao`, role: 'OWNER' };
    return true;
  }
}

describe('Accounting SAF-T HTTP contract', () => {
  let app: INestApplication;
  const summary = jest.fn(async (tenantId: string) => ({
    tenantMarker: tenantId, documentCount: tenantId === 'tenant-a' ? 2 : 1,
    customerCount: 1, productCount: 1, cancelledCount: 0,
    signedDocumentCount: 1, unsignedDocumentCount: tenantId === 'tenant-a' ? 1 : 0,
    taxableBase: '100.00', taxAmount: '14.00', grossTotal: '114.00', warnings: [], errors: [],
  }));
  const preflight = jest.fn(async (tenantId: string, year: number) => ({
    technicalReadiness: year !== 2025, certificationReadiness: false,
    certificationStatus: 'NOT_CERTIFIED', issues: year === 2025
      ? [{ code: 'LEGACY_UNSIGNED_DOCUMENT', severity: 'BLOCKING', message: `legacy:${tenantId}` }] : [],
  }));
  const generate = jest.fn(async (tenantId: string, _userId: string, year: number) => {
    if (year === 2025) throw new BadRequestException({ code: 'SAFT_PREFLIGHT_FAILED', issues: [{ code: 'LEGACY_UNSIGNED_DOCUMENT' }] });
    return { xml: `<?xml version="1.0"?><AuditFile><Tenant>${tenantId}</Tenant></AuditFile>`, validation: { valid: true }, filename: `SAFT-${tenantId}-${year}.xml` };
  });

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AccountingSaftController],
      providers: [
        { provide: AccountingSaftService, useValue: { getReadiness: jest.fn() } },
        { provide: SaftExportService, useValue: { summary, preflight, generate } },
      ],
    }).overrideGuard(JwtAuthGuard).useClass(TestJwtGuard).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });
  afterAll(async () => app.close());

  it('recusa pedidos sem JWT', () => request(app.getHttpServer()).get('/accounting/saft/summary?fiscalYear=2026').expect(401));

  it('deriva o tenant do utilizador autenticado e isola A/B', async () => {
    const a = await request(app.getHttpServer()).get('/accounting/saft/summary?fiscalYear=2026').set('Authorization', 'Bearer tenant-a').expect(200);
    const b = await request(app.getHttpServer()).get('/accounting/saft/summary?fiscalYear=2026').set('Authorization', 'Bearer tenant-b').expect(200);
    expect(a.body.tenantMarker).toBe('tenant-a');
    expect(b.body.tenantMarker).toBe('tenant-b');
    await request(app.getHttpServer()).get('/accounting/saft/summary?fiscalYear=2026&tenantId=tenant-b').set('Authorization', 'Bearer tenant-a').expect(400);
  });

  it('rejeita período inválido e controla período vazio', async () => {
    await request(app.getHttpServer()).get('/accounting/saft/summary?fiscalYear=1999').set('Authorization', 'Bearer tenant-a').expect(400);
    const empty = await request(app.getHttpServer()).get('/accounting/saft/summary?fiscalYear=2027').set('Authorization', 'Bearer tenant-b').expect(200);
    expect(empty.body.tenantMarker).toBe('tenant-b');
  });

  it('expõe blocker para documento legacy unsigned', async () => {
    const result = await request(app.getHttpServer()).get('/accounting/saft/preflight?fiscalYear=2025').set('Authorization', 'Bearer tenant-a').expect(200);
    expect(result.body.issues[0].code).toBe('LEGACY_UNSIGNED_DOCUMENT');
    await request(app.getHttpServer()).get('/accounting/saft/generate?fiscalYear=2025').set('Authorization', 'Bearer tenant-a').expect(400);
  });

  it('gera XML usando exclusivamente o tenant autenticado', async () => {
    const result = await request(app.getHttpServer()).get('/accounting/saft/generate?fiscalYear=2026').set('Authorization', 'Bearer tenant-a').expect(200);
    expect(result.body.xml).toContain('<Tenant>tenant-a</Tenant>');
    expect(result.body.xml).not.toContain('tenant-b');
  });

  it('faz download com MIME, filename e XML isolados', async () => {
    const result = await request(app.getHttpServer()).get('/accounting/saft/download?fiscalYear=2026').set('Authorization', 'Bearer tenant-b').expect(200);
    expect(result.headers['content-type']).toMatch(/^application\/xml; charset=utf-8/);
    expect(result.headers['content-disposition']).toBe('attachment; filename="SAFT-tenant-b-2026.xml"');
    expect(result.text).toContain('<Tenant>tenant-b</Tenant>');
    expect(result.text).not.toContain('tenant-a');
  });
});
