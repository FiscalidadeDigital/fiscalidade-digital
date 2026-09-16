// =====================================================
// AUTENTICAÇÃO — FISCALIDADE DIGITAL
// =====================================================

// =====================================================
// GUARDAR TOKEN
// =====================================================

export function saveToken(
  token: string,
): void {
  if (
    typeof window ===
    'undefined'
  ) {
    return;
  }

  if (!token.trim()) {
    return;
  }

  localStorage.setItem(
    'token',
    token,
  );
}

// =====================================================
// OBTER TOKEN
// =====================================================

export function getToken():
  | string
  | null {
  if (
    typeof window ===
    'undefined'
  ) {
    return null;
  }

  return localStorage.getItem(
    'token',
  );
}

// =====================================================
// GUARDAR UTILIZADOR
// =====================================================

export function saveUser(
  user: unknown,
): void {
  if (
    typeof window ===
    'undefined'
  ) {
    return;
  }

  localStorage.setItem(
    'user',
    JSON.stringify(user),
  );
}

// =====================================================
// OBTER UTILIZADOR
// =====================================================

export function getUser<T = unknown>():
  | T
  | null {
  if (
    typeof window ===
    'undefined'
  ) {
    return null;
  }

  const value =
    localStorage.getItem(
      'user',
    );

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    localStorage.removeItem(
      'user',
    );

    return null;
  }
}

// =====================================================
// GUARDAR TENANT
// =====================================================

export function saveTenant(
  tenant: unknown,
): void {
  if (
    typeof window ===
    'undefined'
  ) {
    return;
  }

  localStorage.setItem(
    'tenant',
    JSON.stringify(tenant),
  );
}

// =====================================================
// OBTER TENANT
// =====================================================

export function getTenant<T = unknown>():
  | T
  | null {
  if (
    typeof window ===
    'undefined'
  ) {
    return null;
  }

  const value =
    localStorage.getItem(
      'tenant',
    );

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    localStorage.removeItem(
      'tenant',
    );

    return null;
  }
}

// =====================================================
// GUARDAR TENANT ID
// =====================================================

export function saveTenantId(
  tenantId: string,
): void {
  if (
    typeof window ===
    'undefined'
  ) {
    return;
  }

  if (!tenantId.trim()) {
    return;
  }

  localStorage.setItem(
    'tenantId',
    tenantId,
  );
}

// =====================================================
// OBTER TENANT ID
// =====================================================

export function getTenantId():
  | string
  | null {
  if (
    typeof window ===
    'undefined'
  ) {
    return null;
  }

  return localStorage.getItem(
    'tenantId',
  );
}

// =====================================================
// REMOVER SESSÃO
// =====================================================

export function removeToken(): void {
  if (
    typeof window ===
    'undefined'
  ) {
    return;
  }

  localStorage.removeItem(
    'token',
  );

  localStorage.removeItem(
    'user',
  );

  localStorage.removeItem(
    'tenant',
  );

  localStorage.removeItem(
    'tenantId',
  );

  sessionStorage.clear();
}

// =====================================================
// VERIFICAR EXISTÊNCIA DO TOKEN
// =====================================================

export function isAuthenticated():
  boolean {
  return Boolean(
    getToken(),
  );
}