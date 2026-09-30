const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

if (!configuredApiUrl) {
  throw new Error(
    'NEXT_PUBLIC_API_URL não está configurada. Defina a URL explícita do backend para este ambiente.',
  );
}

export const API_BASE_URL = configuredApiUrl.replace(/\/+$/, '');
