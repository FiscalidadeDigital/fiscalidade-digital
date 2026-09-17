
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { join } from 'path';
import * as express from 'express';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // =========================================================
  // SEGURANÇA HTTP
  // =========================================================

  app.use(
    helmet({
      crossOriginResourcePolicy: {
        policy: 'cross-origin',
      },
    }),
  );

  // =========================================================
  // VALIDAÇÃO GLOBAL DOS DTOs
  // =========================================================

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // =========================================================
  // FICHEIROS UPLOAD
  // =========================================================

  app.use(
    '/uploads',
    express.static(
      join(process.cwd(), 'uploads'),
    ),
  );

  // =========================================================
  // CORS
  // =========================================================

  const defaultOrigins = [
    // Desenvolvimento local
    'http://localhost:3000',
    'http://127.0.0.1:3000',

    // Domínio oficial
    'https://fiscalidadedigital.ao',
    'https://www.fiscalidadedigital.ao',

    // Domínios principais da Vercel
    'https://fiscalidade-digital.vercel.app',
    'https://fiscalidade-digital-3bh4.vercel.app',

    // Domínio Git Main da Vercel
    'https://fiscalidade-digital-git-main-fiscalidade-digital.vercel.app',
  ];

  const environmentOrigins = (
    process.env.FRONTEND_URLS ||
    process.env.FRONTEND_URL ||
    ''
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const configuredOrigins = [
    ...new Set([
      ...defaultOrigins,
      ...environmentOrigins,
    ]),
  ];

  app.enableCors({
    origin: (
      requestOrigin,
      callback,
    ) => {
      // Permitir pedidos sem Origin:
      // Postman, health checks e comunicação interna.
      if (!requestOrigin) {
        return callback(null, true);
      }

      // Permitir os domínios configurados.
      if (
        configuredOrigins.includes(
          requestOrigin,
        )
      ) {
        return callback(null, true);
      }

      // Permitir URLs de deployment da Vercel
      // relacionadas com o projeto Fiscalidade Digital.
      const isFiscalidadeVercelDomain =
        /^https:\/\/fiscalidade-digital(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(
          requestOrigin,
        );

      if (isFiscalidadeVercelDomain) {
        return callback(null, true);
      }

      return callback(
        new Error(
          `Origem não autorizada pelo CORS: ${requestOrigin}`,
        ),
        false,
      );
    },

    credentials: true,

    methods: [
      'GET',
      'HEAD',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
  });

  // =========================================================
  // PORTA
  // =========================================================

  const port =
    Number(process.env.PORT) || 3001;

  await app.listen(
    port,
    '0.0.0.0',
  );

  console.log(
    `Fiscalidade Digital API executando na porta ${port}.`,
  );

  console.log(
    `Ambiente: ${
      process.env.NODE_ENV || 'development'
    }`,
  );

  console.log(
    `CORS autorizado: ${
      configuredOrigins.join(', ')
    }`,
  );
}

bootstrap();