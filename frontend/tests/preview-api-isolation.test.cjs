const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

function getRewrites(environment) {
  const script = [
    "const config = (await import('./next.config.mjs?test=' + Date.now())).default;",
    'console.log(JSON.stringify(await config.rewrites()));',
  ].join(' ');
  const result = spawnSync(
    process.execPath,
    ['--input-type=module', '-e', script],
    {
      cwd: __dirname + '/..',
      encoding: 'utf8',
      env: {
        ...process.env,
        ...environment,
      },
    },
  );

  assert.equal(result.status, 0, result.stderr);

  return JSON.parse(result.stdout);
}

test('preview without its own target does not route requests to production', () => {
  const environment = {
    VERCEL: '1',
    VERCEL_ENV: 'preview',
    API_PROXY_URL: '',
  };

  assert.deepEqual(getRewrites(environment), [
    {
      source: '/api/:path*',
      destination: '/preview-api-unavailable',
    },
  ]);
});

test('preview uses only the target configured for its environment', () => {
  const environment = {
    VERCEL: '1',
    VERCEL_ENV: 'preview',
    API_PROXY_URL: 'https://preview-api.invalid/',
  };

  assert.deepEqual(getRewrites(environment), [
    {
      source: '/api/:path*',
      destination: 'https://preview-api.invalid/:path*',
    },
  ]);
});
