const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const vm = require('node:vm');

const sourcePath = path.join(__dirname, '..', 'lib', 'safe-error.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;
const loadedModule = { exports: {} };
vm.runInNewContext(
  compiled,
  {
    exports: loadedModule.exports,
    module: loadedModule,
    require: (name) => {
      if (name === 'axios') {
        return { isAxiosError: (value) => value?.isAxiosError === true };
      }
      throw new Error(`Unexpected module: ${name}`);
    },
  },
  { filename: sourcePath },
);

const { getSafeError } = loadedModule.exports;

test('orienta a confirmação de IVA sem expor a resposta interna', () => {
  const result = getSafeError({
    isAxiosError: true,
    response: {
      status: 400,
      data: {
        nextStep: 'CONFIRM_IVA',
        referenceCode: 'FD-AB12CD34',
        message: 'Internal message that must not be shown.',
      },
    },
  });

  assert.equal(
    result.message,
    'Antes de emitir uma factura, confirme a situação de IVA da empresa.',
  );
  assert.equal(result.nextStep, 'CONFIRM_IVA');
  assert.equal(result.reference, 'FD-AB12CD34');
});

test('ignora passos de resposta desconhecidos', () => {
  const result = getSafeError({
    isAxiosError: true,
    response: { status: 400, data: { nextStep: 'UNTRUSTED' } },
  });

  assert.equal(result.message, 'Verifique os dados indicados e tente novamente.');
  assert.equal(result.nextStep, undefined);
});
