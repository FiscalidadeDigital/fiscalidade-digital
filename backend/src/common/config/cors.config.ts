export const DEFAULT_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://fiscalidadedigital.ao',
  'https://www.fiscalidadedigital.ao',
  'https://fiscalidade-digital.vercel.app',
  'https://fiscalidade-digital-3bh4.vercel.app',
  'https://fiscalidade-digital-o5ex.vercel.app',
  'https://fiscalidade-digital-git-main-fiscalidade-digital.vercel.app',
] as const;

export function resolveCorsOrigins(
  environment: { FRONTEND_URLS?: string; FRONTEND_URL?: string } = process.env,
) {
  const environmentOrigins = (environment.FRONTEND_URLS || environment.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [...new Set([...DEFAULT_CORS_ORIGINS, ...environmentOrigins])];
}

export function createCorsOptions(configuredOrigins = resolveCorsOrigins()) {
  return {
    origin: (
      requestOrigin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!requestOrigin || configuredOrigins.includes(requestOrigin)) {
        return callback(null, true);
      }

      return callback(new Error('Origem não autorizada pelo CORS.'), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
  };
}
