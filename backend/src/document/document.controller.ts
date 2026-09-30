import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ExecutionContext,
  Get,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  createParamDecorator,
} from '@nestjs/common';

import {
  FileInterceptor,
} from '@nestjs/platform-express';

import {
  diskStorage,
} from 'multer';

import {
  DocumentCategory,
} from '@prisma/client';

import * as fs from 'fs';

import {
  randomUUID,
} from 'crypto';

import {
  Request,
  Response,
} from 'express';

import { createReadStream } from 'fs';
import { getDocumentStorageDirectory } from './document-storage';

import {
  JwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';

import {
  DocumentService,
  DocumentFile,
} from './document.service';

const CurrentUser =
  createParamDecorator(
    (
      _data: unknown,
      ctx: ExecutionContext,
    ) => {
      const request =
        ctx
          .switchToHttp()
          .getRequest<Request>();

      return request.user;
    },
  );

function ensureUploadDirectory() {
  const uploadDirectory = getDocumentStorageDirectory();

  if (
    !fs.existsSync(
      uploadDirectory,
    )
  ) {
    fs.mkdirSync(
      uploadDirectory,
      {
        recursive: true,
      },
    );
  }

  return uploadDirectory;
}

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentController {
  constructor(
    private readonly documentService: DocumentService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination:
          (
            _req,
            _file,
            callback,
          ) => {
            callback(
              null,
              ensureUploadDirectory(),
            );
          },

        filename:
          (
            _req,
            file,
            callback,
          ) => {
            const extensionByMimeType: Record<string, string> = {
              'application/pdf': '.pdf',
              'image/jpeg': '.jpg',
              'image/png': '.png',
              'image/webp': '.webp',
            };
            const extension =
              extensionByMimeType[file.mimetype] || '.bin';

            const filename =
              `${randomUUID()}${extension}`;

            callback(
              null,
              filename,
            );
          },
      }),

      limits: {
        fileSize:
          10 * 1024 * 1024,
      },

      fileFilter:
        (
          _req,
          file,
          callback,
        ) => {
          const allowedMimeTypes =
            [
              'application/pdf',
              'image/jpeg',
              'image/png',
              'image/webp',
            ];

          if (
            !allowedMimeTypes.includes(
              file.mimetype,
            )
          ) {
            return callback(
              new BadRequestException(
                'Formato não permitido. Utilize PDF, JPG, PNG ou WEBP.',
              ),
              false,
            );
          }

          callback(
            null,
            true,
          );
        },
    }),
  )
  async create(
    @CurrentUser()
    user: any,

    @UploadedFile()
    file: DocumentFile,

    @Body('name')
    name?: string,

    @Body('description')
    description?: string,

    @Body('category')
    category?: DocumentCategory,

    @Body('invoiceId')
    invoiceId?: string,
  ) {
    const tenantId =
      user?.tenantId;

    if (!tenantId) {
      throw new BadRequestException(
        'Tenant não identificado no utilizador autenticado.',
      );
    }

    if (!file) {
      throw new BadRequestException(
        'Nenhum ficheiro foi enviado.',
      );
    }

    return this.documentService.create({
      tenantId,
      file,
      name,
      description,
      category,
      invoiceId,
    });
  }

  @Get()
  async findAll(
    @CurrentUser()
    user: any,

    @Query('search')
    search?: string,

    @Query('category')
    category?: DocumentCategory,

    @Query('invoiceId')
    invoiceId?: string,
  ) {
    const tenantId =
      user?.tenantId;

    if (!tenantId) {
      throw new BadRequestException(
        'Tenant não identificado no utilizador autenticado.',
      );
    }

    return this.documentService.findAll(
      tenantId,
      {
        search,
        category,
        invoiceId,
      },
    );
  }

  @Get('summary')
  async getSummary(
    @CurrentUser()
    user: any,
  ) {
    const tenantId =
      user?.tenantId;

    if (!tenantId) {
      throw new BadRequestException(
        'Tenant não identificado no utilizador autenticado.',
      );
    }

    return this.documentService.getSummary(
      tenantId,
    );
  }

  @Get(':id')
  async findOne(
    @CurrentUser()
    user: any,

    @Param('id')
    id: string,
  ) {
    const tenantId =
      user?.tenantId;

    if (!tenantId) {
      throw new BadRequestException(
        'Tenant não identificado no utilizador autenticado.',
      );
    }

    return this.documentService.findOne(
      tenantId,
      id,
    );
  }

  @Get(':id/content')
  async getContent(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = await this.documentService.getFile(
      user.tenantId,
      id,
    );
    const safeName = file.originalName.replace(/[\r\n\"]/g, '_');
    const safeMimeTypes = new Set([
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ]);
    const contentType = safeMimeTypes.has(file.mimeType)
      ? file.mimeType
      : 'application/octet-stream';

    response.set({
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    });

    return new StreamableFile(
      createReadStream(file.path),
      {
        type: contentType,
        disposition: `${contentType === 'application/octet-stream' ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(safeName)}`,
        length: file.size,
      },
    );
  }

  @Delete(':id')
  async remove(
    @CurrentUser()
    user: any,

    @Param('id')
    id: string,
  ) {
    const tenantId =
      user?.tenantId;

    if (!tenantId) {
      throw new BadRequestException(
        'Tenant não identificado no utilizador autenticado.',
      );
    }

    return this.documentService.remove(
      tenantId,
      id,
    );
  }
}
