const PUBLIC_TENANT_PATHS = new Set([
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/terms',
  '/privacy',
  '/verify-email',
  '/onboarding',
  '/first-access',
]);

export type TenantRouteAccessState =
  | 'public'
  | 'checking'
  | 'granted'
  | 'redirect';

export function requiresTenantSession(pathname: string | null): boolean {
  if (!pathname) {
    return true;
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return false;
  }

  return !PUBLIC_TENANT_PATHS.has(pathname);
}

export function getTenantRouteAccessState({
  pathname,
  initialized,
  loading,
  isAuthenticated,
}: {
  pathname: string | null;
  initialized: boolean;
  loading: boolean;
  isAuthenticated: boolean;
}): TenantRouteAccessState {
  if (!pathname || (requiresTenantSession(pathname) && (!initialized || loading))) {
    return 'checking';
  }

  if (!requiresTenantSession(pathname)) {
    return 'public';
  }

  return isAuthenticated ? 'granted' : 'redirect';
}

export function getSafeInternalRedirect(
  candidate: string | null | undefined,
  fallback = '/dashboard',
): string {
  if (!candidate) {
    return fallback;
  }

  const value = candidate.trim();
  if (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.startsWith('/\\') ||
    /[\u0000\r\n]/.test(value)
  ) {
    return fallback;
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return fallback;
  }

  if (
    !decoded.startsWith('/') ||
    decoded.startsWith('//') ||
    decoded.startsWith('/\\') ||
    /[\u0000\r\n]/.test(decoded)
  ) {
    return fallback;
  }

  try {
    const origin = 'https://fiscalidade.invalid';
    const target = new URL(value, origin);

    if (
      target.origin !== origin ||
      !target.pathname.startsWith('/') ||
      !requiresTenantSession(target.pathname)
    ) {
      return fallback;
    }

    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return fallback;
  }
}

export function buildLoginPath(
  intendedPath: string | null | undefined,
  reason?: string,
): string {
  const params = new URLSearchParams({
    redirect: getSafeInternalRedirect(intendedPath),
  });

  if (reason) {
    params.set('reason', reason);
  }

  return `/login?${params.toString()}`;
}
