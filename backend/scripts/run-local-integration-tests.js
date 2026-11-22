const path = require('path');
const { existsSync } = require('fs');
const { spawnSync } = require('child_process');
const { generateKeyPairSync } = require('crypto');
const dotenv = require('dotenv');

const backendRoot = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(backendRoot, '.env') });

const bundledSchemaEngine = path.join(
  backendRoot,
  'node_modules',
  '@prisma',
  'engines',
  process.platform === 'win32'
    ? 'schema-engine-windows.exe'
    : 'schema-engine',
);

const configuredUrl = process.env.DATABASE_URL;
if (!configuredUrl) {
  throw new Error('DATABASE_URL local não está configurado.');
}

const databaseUrl = new URL(configuredUrl);
const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
if (!localHosts.has(databaseUrl.hostname)) {
  throw new Error(
    'Recusa de segurança: os testes de integração exigem PostgreSQL local.',
  );
}

const testDatabaseName =
  process.env.TEST_DATABASE_NAME || 'fiscalidade_codex_test_20260929';
if (!/^[a-zA-Z0-9_]*test[a-zA-Z0-9_]*$/i.test(testDatabaseName)) {
  throw new Error(
    'Recusa de segurança: TEST_DATABASE_NAME deve identificar uma base de teste.',
  );
}

databaseUrl.pathname = `/${testDatabaseName}`;

// Normal invoices must be signed.  Generate an ephemeral key for this local
// test process so integration tests never depend on a developer or production
// signing key from the environment.
const { privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 1024,
});

const childEnvironment = {
  ...process.env,
  DATABASE_URL: databaseUrl.toString(),
  NODE_ENV: 'test',
  JWT_SECRET: 'local-integration-only-secret-with-32-bytes-minimum',
  FISCAL_SIGNATURE_PRIVATE_KEY: privateKey
    .export({ type: 'pkcs1', format: 'pem' })
    .toString(),
  FISCAL_SIGNATURE_KEY_VERSION: '1',
};

// The local integration runner must remain self-contained. When Prisma's
// bundled schema engine is available, use it instead of asking the network
// for a checksum before applying migrations to the local test database.
if (
  !childEnvironment.PRISMA_SCHEMA_ENGINE_BINARY &&
  existsSync(bundledSchemaEngine)
) {
  childEnvironment.PRISMA_SCHEMA_ENGINE_BINARY = bundledSchemaEngine;
  childEnvironment.PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING = '1';
}

const run = (entrypoint, args) => {
  const result = spawnSync(process.execPath, [entrypoint, ...args], {
    cwd: backendRoot,
    env: childEnvironment,
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

run(path.join(backendRoot, 'node_modules', 'prisma', 'build', 'index.js'), [
  'migrate',
  'deploy',
]);

run(path.join(backendRoot, 'node_modules', 'jest', 'bin', 'jest.js'), [
  '--config',
  'test/jest.integration.json',
  '--runInBand',
  ...process.argv.slice(2),
]);
