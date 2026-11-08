import { isAxiosError } from 'axios';

/**
 * Errors returned by a remote service are untrusted input.  In particular,
 * their message can contain implementation details such as paths, SQL or
 * provider responses, so it must never be rendered directly in the UI.
 */
export type SafeError = {
  message: string;
  reference?: string;
};

const DEFAULT_MESSAGE = 'Não foi possível concluir esta ação. Tente novamente.';

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Verifique os dados indicados e tente novamente.',
  401: 'A sua sessão terminou. Inicie sessão novamente.',
  403: 'Não tem permissão para concluir esta ação.',
  404: 'O item solicitado já não está disponível.',
  409: 'Os dados foram alterados. Atualize a página e tente novamente.',
  422: 'Verifique os dados indicados e tente novamente.',
  429: 'Foram efetuadas demasiadas tentativas. Aguarde alguns instantes e tente novamente.',
  500: 'Ocorreu uma indisponibilidade temporária. Tente novamente mais tarde.',
  502: 'Ocorreu uma indisponibilidade temporária. Tente novamente mais tarde.',
  503: 'Ocorreu uma indisponibilidade temporária. Tente novamente mais tarde.',
  504: 'Ocorreu uma indisponibilidade temporária. Tente novamente mais tarde.',
};

type ErrorPayload = {
  message?: unknown;
  reference?: unknown;
  referenceCode?: unknown;
};

function safeReference(payload: ErrorPayload | undefined): string | undefined {
  const candidate = payload?.referenceCode ?? payload?.reference;

  if (typeof candidate !== 'string') return undefined;

  const reference = candidate.trim();

  // A support reference must be short and opaque.  UUIDs, database ids,
  // paths and arbitrary provider values are intentionally not displayed.
  return /^FD-[A-Z0-9]{8}$/i.test(reference) ? reference : undefined;
}

/** Returns a customer-safe message without exposing a server error body. */
export function getSafeError(
  error: unknown,
  fallback = DEFAULT_MESSAGE,
): SafeError {
  if (!isAxiosError<ErrorPayload>(error)) {
    return { message: fallback };
  }

  if (!error.response) {
    return {
      message:
        'Não foi possível comunicar com o serviço. Verifique a ligação e tente novamente.',
    };
  }

  return {
    message: STATUS_MESSAGES[error.response.status] ?? fallback,
    reference: safeReference(error.response.data),
  };
}

export function getSafeErrorMessage(
  error: unknown,
  fallback = DEFAULT_MESSAGE,
): string {
  const safe = getSafeError(error, fallback);
  return safe.reference
    ? `${safe.message} Código de referência: ${safe.reference}.`
    : safe.message;
}

/**
 * Preserves the Axios error shape used by older screens while replacing an
 * untrusted response body with the same safe, customer-facing information.
 */
export function sanitizeApiError(error: unknown): unknown {
  if (!isAxiosError<ErrorPayload>(error) || !error.response) {
    return error;
  }

  const safe = getSafeError(error);
  error.response.data = {
    message: safe.message,
    ...(safe.reference ? { referenceCode: safe.reference } : {}),
  };
  return error;
}
