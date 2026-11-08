const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const alertsSource = fs.readFileSync(
  path.join(__dirname, '..', 'components', 'dashboard', 'Alerts.tsx'),
  'utf8',
);

test('os alertas do dashboard formatam a data e acomodam o cabeçalho no móvel', () => {
  assert.match(alertsSource, /function formatAlertDate/);
  assert.match(alertsSource, /const formattedDate =\s*formatAlertDate\(\s*alert\.date/);
  assert.match(alertsSource, /return `\$\{day\}\/\$\{month\}\/\$\{year\}`/);
  assert.match(alertsSource, /flex flex-col gap-1\.5 sm:flex-row/);
  assert.match(alertsSource, /<time/);
});
