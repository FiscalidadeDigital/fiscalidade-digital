const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const vm = require('node:vm');

const sourcePath = path.join(__dirname, '..', 'lib', 'auth-form-validation.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const loadedModule = { exports: {} };
vm.runInNewContext(compiled, { exports: loadedModule.exports, module: loadedModule, Object }, { filename: sourcePath });

const { normalizeRecoveryEmail, validateRegistrationForm, validateResetPasswordForm } = loadedModule.exports;

test('aceita um registo completo e válido sem pedir rede', () => {
  assert.deepEqual(validateRegistrationForm({
    name: 'Ana Silva',
    email: 'ana@empresa.ao',
    password: 'palavra-passe-segura',
    confirmPassword: 'palavra-passe-segura',
    acceptTerms: true,
    acceptPrivacyPolicy: true,
  }), {});
});

test('mostra erros locais de registo antes de qualquer submissão', () => {
  const errors = validateRegistrationForm({
    name: ' ',
    email: 'email-inválido',
    password: 'curta',
    confirmPassword: 'diferente',
    acceptTerms: false,
    acceptPrivacyPolicy: false,
  });

  assert.equal(errors.name, 'Indique o seu nome completo.');
  assert.equal(errors.email, 'Indique um email válido.');
  assert.equal(errors.password, 'A palavra-passe deve ter pelo menos 12 caracteres.');
  assert.equal(errors.confirmPassword, 'As palavras-passe não coincidem.');
  assert.equal(errors.acceptTerms, 'É necessário aceitar os Termos de Utilização.');
  assert.equal(errors.acceptPrivacyPolicy, 'É necessário aceitar a Política de Privacidade.');
});

test('valida o código e a confirmação na recuperação sem chamar a API', () => {
  const errors = validateResetPasswordForm({
    email: 'conta@empresa.ao',
    code: '123',
    password: 'palavra-passe-segura',
    confirmPassword: 'palavra-passe-diferente',
  });

  assert.equal(errors.code, 'Introduza o código de 6 dígitos recebido.');
  assert.equal(errors.confirmPassword, 'As palavras-passe não coincidem.');
});

test('normaliza o email de recuperação sem persistir dados', () => {
  assert.equal(normalizeRecoveryEmail('  Conta@Empresa.AO  '), 'conta@empresa.ao');
});
