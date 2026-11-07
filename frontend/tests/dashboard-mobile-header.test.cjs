const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const dashboardLayoutSource = fs.readFileSync(
  path.join(
    __dirname,
    '..',
    'components',
    'layout',
    'DashboardLayout.tsx',
  ),
  'utf8',
);

test('o logotipo fica centrado no cabecalho do menu movel', () => {
  assert.match(
    dashboardLayoutSource,
    /mobile\s*\? 'absolute left-1\/2 -translate-x-1\/2'/,
  );
  assert.match(
    dashboardLayoutSource,
    /fd-sidebar-close\s+absolute\s+right-4/,
  );
});
