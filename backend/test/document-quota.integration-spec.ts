import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { DocumentFile, DocumentService } from '../src/document/document.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { assertIsolatedTestDatabaseEnvironment } from './helpers/test-database';

describe('Document storage quota concurrency', () => {
  const prisma = new PrismaService();
  const service = new DocumentService(prisma);
  let tenantId: string;
  let storageDirectory: string;
  const originalStorageDirectory = process.env.DOCUMENT_STORAGE_DIR;

  beforeAll(async () => {
    assertIsolatedTestDatabaseEnvironment();
    await prisma.$connect();
    storageDirectory = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'fiscal-quota-integration-'),
    );
    process.env.DOCUMENT_STORAGE_DIR = storageDirectory;

    const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const tenant = await prisma.tenant.create({
      data: {
        name: `Quota Tenant ${runId}`,
        nif: `QUOTA-${runId}`,
        email: `quota-${runId}@example.test`,
        storageBaseQuotaBytes: BigInt(18),
      },
    });
    tenantId = tenant.id;
  });

  afterAll(async () => {
    if (tenantId) {
      await prisma.tenant.deleteMany({ where: { id: tenantId } });
    }
    await prisma.$disconnect();
    if (originalStorageDirectory === undefined) {
      delete process.env.DOCUMENT_STORAGE_DIR;
    } else {
      process.env.DOCUMENT_STORAGE_DIR = originalStorageDirectory;
    }
    if (storageDirectory) {
      await fs.promises.rm(storageDirectory, { recursive: true, force: true });
    }
  });

  async function createPdf(name: string): Promise<DocumentFile> {
    const filePath = path.join(storageDirectory, name);
    const content = Buffer.from('%PDF-data1');
    await fs.promises.writeFile(filePath, content);
    return {
      fieldname: 'file',
      originalname: name,
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: content.length,
      destination: storageDirectory,
      filename: name,
      path: filePath,
    };
  }

  it('permite apenas um de dois uploads concorrentes que excederiam a quota', async () => {
    const [firstFile, secondFile] = await Promise.all([
      createPdf('first.pdf'),
      createPdf('second.pdf'),
    ]);

    const results = await Promise.allSettled([
      service.create({ tenantId, file: firstFile }),
      service.create({ tenantId, file: secondFile }),
    ]);
    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toMatchObject({
      status: 413,
    });

    const [tenant, documents] = await Promise.all([
      prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
      prisma.document.findMany({ where: { tenantId } }),
    ]);
    expect(documents).toHaveLength(1);
    expect(tenant.storageUsedBytes).toBe(BigInt(documents[0].size));

    await service.remove(tenantId, documents[0].id);
    await expect(
      prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
    ).resolves.toEqual(expect.objectContaining({ storageUsedBytes: BigInt(0) }));
  });
});
