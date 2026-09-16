import {
  NestFactory,
} from '@nestjs/core';

import {
  AppModule,
} from './app.module';

import {
  join,
} from 'path';

import {
  NestExpressApplication,
} from '@nestjs/platform-express';

async function bootstrap() {
  const app =
    await NestFactory.create<NestExpressApplication>(
      AppModule,
    );

  /**
   * Servir ficheiros estáticos
   *
   * Exemplo:
   *
   * http://localhost:3001/uploads/documents/arquivo.pdf
   */
  app.useStaticAssets(
    join(
      process.cwd(),
      'uploads',
    ),
    {
      prefix:
        '/uploads/',
    },
  );

  /**
   * CORS
   */
  app.enableCors({
    origin:
      'http://localhost:3000',

    credentials: true,
  });

  /**
   * Porta da API
   */
  await app.listen(
    3001,
  );
}

bootstrap();