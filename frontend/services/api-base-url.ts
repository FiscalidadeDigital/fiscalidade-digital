const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

/**
 * Fallback exclusivo do frontend publicado no domínio oficial. A variável de
 * ambiente continua a ser a configuração recomendada para cada ambiente.
 */
const OFFICIAL_FRONTEND_HOSTS = new Set([
  'fiscalidadedigital.ao',
  'www.fiscalidadedigital.ao',
]);

const OFFICIAL_BACKEND_URL =
  'https://fiscalidade-digital-api.onrender.com';

function officialBrowserFallback(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return OFFICIAL_FRONTEND_HOSTS.has(window.location.hostname)
    ? OFFICIAL_BACKEND_URL
    : undefined;
}

/**
 * Does not run validation during module import, so static Next.js rendering
 * remains independent of a runtime API URL. Consumers call this immediately
 * before a real HTTP request.
 */
export function getApiBaseUrl(): string {
  const apiUrl = configuredApiUrl || officialBrowserFallback();
  if (!apiUrl) {
    throw new Error(
      'NEXT_PUBLIC_API_URL não está configurada. Defina a URL explícita do backend para este ambiente.',
    );
  }
  return apiUrl.replace(/\/+$/, '');
}

/** Available for Axios setup only; may be undefined during build/prerender. */
export const API_BASE_URL = configuredApiUrl?.replace(/\/+$/, '')
  || officialBrowserFallback();
