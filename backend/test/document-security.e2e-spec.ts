import { NotFoundException } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  DocumentFile,
  DocumentService,
} from '../src/document/document.service';

describe('Document tenant isolation', () => {
  const prisma = {
    document: {
      findFirst: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
    },
    $executeRaw: jest.fn(),
    $transaction: jest.fn(async (callback: (tx: any) => unknown) =>
      callback(prisma),
    ),
  } as any;
  const service = new DocumentService(prisma);
  const originalCwd = process.cwd();
  const originalStorageDirectory = process.env.DOCUMENT_STORAGE_DIR;
  let tempRoot: string;

  beforeAll(async () => {
    tempRoot = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'fiscal-doc-security-'),
    );
    await fs.promises.mkdir(
      path.join(tempRoot, 'uploads', 'documents'),
      { recursive: true },
    );
    process.env.DOCUMENT_STORAGE_DIR = path.join(
      tempRoot,
      'uploads',
      'documents',
    );
    process.chdir(tempRoot);
  });

  afterAll(async () => {
    process.chdir(originalCwd);
    if (originalStorageDirectory === undefined) {
      delete process.env.DOCUMENT_STORAGE_DIR;
    } else {
      process.env.DOCUMENT_STORAGE_DIR = originalStorageDirectory;
    }
    await fs.promises.rm(tempRoot, { recursive: true, force: true });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.document.deleteMany.mockResolvedValue({ count: 1 });
    prisma.$executeRaw.mockResolvedValue(1);
  });

  it('does not return an internal file path or public URL from metadata', async () => {
    prisma.document.findFirst.mockResolvedValue({
      id: 'doc-1',
      tenantId: 'tenant-a',
      name: 'Tax document',
      originalName: 'tax.pdf',
      description: null,
      category: 'OUTROS',
      mimeType: 'application/pdf',
      size: 100,
      filePath: 'C:/private/uploads/tax.pdf',
      fileUrl: '/uploads/documents/tax.pdf',
      invoiceId: null,
      createdAt: new Date(0),
      updatedAt: new Date(0),
      invoice: null,
    });

    const result = await service.findOne('tenant-a', 'doc-1');

    expect(prisma.document.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'doc-1', tenantId: 'tenant-a' },
      }),
    );
    expect(result).not.toHaveProperty('tenantId');
    expect(result).not.toHaveProperty('filePath');
    expect(result).not.toHaveProperty('fileUrl');
  });

  it('denies a document lookup when it is not owned by the authenticated tenant', async () => {
    prisma.document.findFirst.mockResolvedValue(null);

    await expect(service.getFile('tenant-b', 'doc-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.document.findFirst).toHaveBeenCalledWith({
      where: { id: 'doc-1', tenantId: 'tenant-b' },
      select: {
        filePath: true,
        mimeType: true,
        originalName: true,
        size: true,
      },
    });
  });

  it('streams only files whose resolved path is inside private document storage', async () => {
    const privateFile = path.join(
      tempRoot,
      'uploads',
      'documents',
      'private.pdf',
    );
    await fs.promises.writeFile(privateFile, '%PDF-test');
    prisma.document.findFirst.mockResolvedValue({
      filePath: path.relative(tempRoot, privateFile),
      mimeType: 'application/pdf',
      originalName: 'private.pdf',
      size: 9,
    });

    await expect(service.getFile('tenant-a', 'doc-1')).resolves.toEqual({
      path: await fs.promises.realpath(privateFile),
      mimeType: 'application/pdf',
      originalName: 'private.pdf',
      size: 9,
    });

    const outsideFile = path.join(tempRoot, 'outside.txt');
    await fs.promises.writeFile(outsideFile, 'private');
    prisma.document.findFirst.mockResolvedValue({
      filePath: path.relative(
        path.join(tempRoot, 'uploads', 'documents'),
        outsideFile,
      ),
      mimeType: 'text/plain',
      originalName: 'outside.txt',
      size: 7,
    });

    await expect(service.getFile('tenant-a', 'doc-2')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    prisma.document.findFirst.mockResolvedValue({
      id: 'doc-3',
      tenantId: 'tenant-a',
      size: 7,
      filePath: path.relative(
        path.join(tempRoot, 'uploads', 'documents'),
        outsideFile,
      ),
    });
    await service.remove('tenant-a', 'doc-3');
    await expect(fs.promises.access(outsideFile)).resolves.toBeUndefined();
  });

  it('rejects a forged PDF MIME type and removes the uploaded file', async () => {
    const uploadedPath = path.join(tempRoot, 'forged.pdf');
    await fs.promises.writeFile(uploadedPath, 'not a PDF');
    const file: DocumentFile = {
      fieldname: 'file',
      originalname: 'forged.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 9,
      destination: tempRoot,
      filename: 'forged.pdf',
      path: uploadedPath,
    };

    await expect(
      service.create({ tenantId: 'tenant-a', file }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(fs.promises.access(uploadedPath)).rejects.toThrow();
    expect(prisma.document.create).not.toHaveBeenCalled();
  });

  it('removes the uploaded file when the configured quota rejects it', async () => {
    const uploadedPath = path.join(tempRoot, 'quota.pdf');
    await fs.promises.writeFile(uploadedPath, '%PDF-quota');
    const file: DocumentFile = {
      fieldname: 'file',
      originalname: 'quota.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 10,
      destination: tempRoot,
      filename: 'quota.pdf',
      path: uploadedPath,
    };
    prisma.$executeRaw.mockResolvedValueOnce(0);
    prisma.tenant.findUnique.mockResolvedValue({ id: 'tenant-a' });

    await expect(
      service.create({ tenantId: 'tenant-a', file }),
    ).rejects.toMatchObject({ status: 413 });
    await expect(fs.promises.access(uploadedPath)).rejects.toThrow();
    expect(prisma.document.create).not.toHaveBeenCalled();
  });

  it('reserva bytes e cria o registo na mesma transacção', async () => {
    const uploadedPath = path.join(tempRoot, 'accepted.pdf');
    await fs.promises.writeFile(uploadedPath, '%PDF-accepted');
    const file: DocumentFile = {
      fieldname: 'file',
      originalname: 'accepted.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 13,
      destination: tempRoot,
      filename: 'accepted.pdf',
      path: uploadedPath,
    };
    prisma.document.create.mockResolvedValue({
      id: 'doc-accepted',
      name: 'accepted.pdf',
      originalName: 'accepted.pdf',
      category: 'OUTROS',
      mimeType: 'application/pdf',
      size: 13,
      filePath: 'accepted.pdf',
      invoiceId: null,
      invoice: null,
    });

    await expect(
      service.create({ tenantId: 'tenant-a', file }),
    ).resolves.toEqual(expect.objectContaining({ id: 'doc-accepted', size: 13 }));
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
    expect(prisma.document.create).toHaveBeenCalledTimes(1);
  });
});
