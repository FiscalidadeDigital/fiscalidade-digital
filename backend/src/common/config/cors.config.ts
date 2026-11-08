import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export function createCorsConfig(env: NodeJS.ProcessEnv = process.env) {
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
    'https://fiscalidade-digital-o5ex.vercel.app',

    // Domínio Git Main da Vercel
    'https://fiscalidade-digital-git-main-fiscalidade-digital.vercel.app',
  ];

  const environmentOrigins = (
    env.FRONTEND_URLS ||
    env.FRONTEND_URL ||
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

  const options: CorsOptions = {
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

      return callback(
        null,
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
  };
  return { configuredOrigins, options };
}
