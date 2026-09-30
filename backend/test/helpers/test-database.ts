export function assertIsolatedTestDatabaseEnvironment(): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Os testes de integração exigem NODE_ENV=test.');
  }

  const configuredUrl = process.env.DATABASE_URL;
  if (!configuredUrl) {
    throw new Error('DATABASE_URL de teste não está configurado.');
  }

  const databaseUrl = new URL(configuredUrl);
  const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
  if (!localHosts.has(databaseUrl.hostname)) {
    throw new Error(
      'Recusa de segurança: a base de integração tem de ser local.',
    );
  }

  const databaseName = decodeURIComponent(
    databaseUrl.pathname.replace(/^\//, ''),
  );
  if (!/test/i.test(databaseName)) {
    throw new Error(
      'Recusa de segurança: o nome da base tem de conter "test".',
    );
  }
}
