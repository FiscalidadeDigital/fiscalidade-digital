const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const quickActionsSource = fs.readFileSync(
  path.join(__dirname, '..', 'components', 'dashboard', 'QuickActions.tsx'),
  'utf8',
);
const nextConfigSource = fs.readFileSync(
  path.join(__dirname, '..', 'next.config.mjs'),
  'utf8',
);

test('a ação rápida de documentos usa a biblioteca autenticada', () => {
  assert.match(quickActionsSource, /href="\/library"/);
  assert.match(quickActionsSource, /Gerir documentos/);
  assert.doesNotMatch(quickActionsSource, /href="\/documents"/);
});

test('o endereço legado de documentos redireciona para a área autenticada', () => {
  assert.match(nextConfigSource, /source: '\/documents'/);
  assert.match(nextConfigSource, /destination: '\/library'/);
});
