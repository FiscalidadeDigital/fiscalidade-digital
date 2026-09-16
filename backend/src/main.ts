import {
  ValidationPipe,
} from '@nestjs/common';

import {
  NestFactory,
} from '@nestjs/core';

import {
  AppModule,
} from './app.module';

import {
  join,
} from 'path';

import * as express from 'express';

import helmet from 'helmet';

async function bootstrap() {
  const app =
    await NestFactory.create(
      AppModule,
    );

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
  //
  // Mantemos /uploads nesta fase.
  //
  // Posteriormente podemos migrar para Object Storage.
  // =========================================================

  app.use(
    '/uploads',
    express.static(
      join(
        process.cwd(),
        'uploads',
      ),
    ),
  );

  // =========================================================
  // CORS
  // =========================================================
  //
  // Desenvolvimento:
  //   http://localhost:3000
  //
  // Produção:
  //   FRONTEND_URL=https://app.fiscalidade.ao
  //
  // Também aceitamos FRONTEND_URLS separado por vírgula
  // para permitir mais de um frontend.
  // =========================================================

  const configuredOrigins =
    (
      process.env.FRONTEND_URLS ||
      process.env.FRONTEND_URL ||
      'http://localhost:3000'
    )
      .split(',')
      .map(
        (origin) =>
          origin.trim(),
      )
      .filter(
        Boolean,
      );

  app.enableCors({
    origin: (
      requestOrigin,
      callback,
    ) => {
      // Permitir pedidos sem Origin:
      // Postman, health checks, comunicação interna, etc.
      if (!requestOrigin) {
        return callback(
          null,
          true,
        );
      }

      if (
        configuredOrigins.includes(
          requestOrigin,
        )
      ) {
        return callback(
          null,
          true,
        );
      }

      return callback(
        new Error(
          'Origem não autorizada pelo CORS.',
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
  // PREFIXO OPCIONAL DA API
  // =========================================================
  //
  // Não activamos /api globalmente agora porque o frontend
  // actual provavelmente utiliza as rotas existentes
  // directamente.
  //
  // Assim evitamos quebrar:
  //
  // /auth
  // /invoice
  // /obligations
  // /payroll
  // etc.
  // =========================================================

  // =========================================================
  // PORTA
  // =========================================================

  const port =
    Number(
      process.env.PORT,
    ) || 3001;

  await app.listen(
    port,
    '0.0.0.0',
  );

  console.log(
    `Fiscalidade Digital API executando na porta ${port}.`,
  );

  console.log(
    `Ambiente: ${
      process.env.NODE_ENV ||
      'development'
    }`,
  );

  console.log(
    `CORS autorizado: ${
      configuredOrigins.join(
        ', ',
      )
    }`,
  );
}

bootstrap();