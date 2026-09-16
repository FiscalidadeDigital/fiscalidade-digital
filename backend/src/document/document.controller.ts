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

import * as path from 'path';

import {
  randomUUID,
} from 'crypto';

import {
  Request,
} from 'express';

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
  const uploadDirectory =
    path.join(
      process.cwd(),
      'uploads',
      'documents',
    );

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
            const extension =
              path.extname(
                file.originalname,
              );

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