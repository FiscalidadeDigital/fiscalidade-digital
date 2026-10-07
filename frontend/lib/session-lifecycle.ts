export const SESSION_EXPIRED_EVENT = 'fd:session-expired';

const tenantKeys = new Set([
  'token',
  'accessToken',
  'authToken',
  'refreshToken',
  'user',
  'currentUser',
  'tenant',
  'tenantId',
]);

/** Clears only authenticated/tenant-scoped browser state. Theme and public UX preferences survive. */
export function clearTenantSession(): void {
  if (typeof window === 'undefined') return;

  for (const storage of [window.localStorage, window.sessionStorage]) {
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);
      if (key && (tenantKeys.has(key) || key.startsWith('fd-tenant:'))) {
        storage.removeItem(key);
      }
    }
  }
}

export function notifySessionExpired(): void {
  if (typeof window === 'undefined') return;
  clearTenantSession();
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}
