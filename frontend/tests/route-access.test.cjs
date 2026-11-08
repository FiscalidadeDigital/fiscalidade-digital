const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const vm = require('node:vm');

const sourcePath = path.join(__dirname, '..', 'lib', 'route-access.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const loadedModule = { exports: {} };
vm.runInNewContext(compiled, {
  URL,
  URLSearchParams,
  decodeURIComponent,
  exports: loadedModule.exports,
  module: loadedModule,
  Set,
}, { filename: sourcePath });

const {
  buildLoginPath,
  getSafeInternalRedirect,
  getTenantRouteAccessState,
  requiresTenantSession,
} = loadedModule.exports;

test('mantém apenas os percursos públicos fora da guarda da empresa', () => {
  for (const pathname of ['/', '/login', '/register', '/forgot-password', '/reset-password', '/terms', '/privacy', '/verify-email', '/onboarding', '/first-access']) {
    assert.equal(requiresTenantSession(pathname), false, pathname);
  }

  for (const pathname of ['/assistant', '/dashboard', '/library', '/revenue', '/legislation', '/purchase-invoices/import']) {
    assert.equal(requiresTenantSession(pathname), true, pathname);
  }

  assert.equal(requiresTenantSession('/admin/login'), false);
});

test('não mostra uma rota privada enquanto a sessão está a ser confirmada', () => {
  assert.equal(getTenantRouteAccessState({
    pathname: '/assistant',
    initialized: false,
    loading: true,
    isAuthenticated: false,
  }), 'checking');

  assert.equal(getTenantRouteAccessState({
    pathname: '/assistant',
    initialized: true,
    loading: false,
    isAuthenticated: false,
  }), 'redirect');

  assert.equal(getTenantRouteAccessState({
    pathname: '/assistant',
    initialized: true,
    loading: false,
    isAuthenticated: true,
  }), 'granted');
});

test('preserva somente destinos internos seguros depois do início de sessão', () => {
  assert.equal(
    getSafeInternalRedirect('/assistant?tema=iva#pergunta'),
    '/assistant?tema=iva#pergunta',
  );
  assert.equal(
    buildLoginPath('/assistant?tema=iva'),
    '/login?redirect=%2Fassistant%3Ftema%3Diva',
  );

  for (const value of [
    'https://example.test',
    '//example.test',
    '/\\example.test',
    '/%2F%2Fexample.test',
    '/%5Cexample.test',
    '/admin/dashboard',
    '/login',
    'dashboard',
  ]) {
    assert.equal(getSafeInternalRedirect(value), '/dashboard', value);
  }
});
