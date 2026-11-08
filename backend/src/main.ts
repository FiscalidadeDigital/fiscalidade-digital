import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { SafeHttpExceptionFilter } from './common/filters/safe-http-exception.filter';
import {
  createCorsOptions,
  resolveCorsOrigins,
} from './common/config/cors.config';

import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Render encaminha o cliente através de um proxy. Sem esta configuração,
  // req.ip identifica o proxy e agrupa utilizadores distintos no mesmo bucket.
  app.set('trust proxy', 1);

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

  app.useGlobalFilters(new SafeHttpExceptionFilter());

  // =========================================================
  // CORS
  // =========================================================

  const configuredOrigins = resolveCorsOrigins();
  app.enableCors(createCorsOptions(configuredOrigins));

  // =========================================================
  // PORTA
  // =========================================================

  const port = Number(process.env.PORT) || 3001;

  await app.listen(port, '0.0.0.0');

  console.log(`Fiscalidade Digital API executando na porta ${port}.`);

  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);

  console.log(`CORS autorizado: ${configuredOrigins.join(', ')}`);
}

bootstrap();
