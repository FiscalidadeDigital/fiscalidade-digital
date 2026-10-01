const PRODUCTION_API_URL =
  'https://fiscalidade-digital-api.onrender.com';

const LOCAL_API_URL =
  'http://localhost:3001';

function normalizeApiUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

function getConfiguredApiUrl(): string | null {
  const configured =
    process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!configured) {
    return null;
  }

  return normalizeApiUrl(configured);
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1'
  );
}

/**
 * Resolve a URL base da API da Fiscalidade Digital.
 *
 * Prioridade:
 * 1. NEXT_PUBLIC_API_URL
 * 2. localhost:3001 em desenvolvimento local
 * 3. API oficial de produção no Render
 */
export function getApiBaseUrl(): string {
  const configured = getConfiguredApiUrl();

  if (configured) {
    return configured;
  }

  if (isBrowser()) {
    const hostname = window.location.hostname;

    if (isLocalHostname(hostname)) {
      return LOCAL_API_URL;
    }
  }

  if (process.env.NODE_ENV === 'development') {
    return LOCAL_API_URL;
  }

  return PRODUCTION_API_URL;
}

/**
 * Compatibilidade com módulos que importam API_BASE_URL.
 */
export const API_BASE_URL =
  getConfiguredApiUrl() ??
  (process.env.NODE_ENV === 'development'
    ? LOCAL_API_URL
    : PRODUCTION_API_URL);

export default getApiBaseUrl;