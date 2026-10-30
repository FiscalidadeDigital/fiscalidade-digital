const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'app', 'page.tsx'),
  'utf8',
);
const whyChooseSource = fs.readFileSync(
  path.join(__dirname, '..', 'components', 'landing', 'WhyChooseSection.tsx'),
  'utf8',
);

test('a preferência de idioma da landing é persistida separadamente da sessão', () => {
  assert.match(source, /const landingLocaleStorageKey = 'fd:landing-locale';/);
  assert.match(source, /window\.localStorage\.getItem\(landingLocaleStorageKey\)/);
  assert.match(source, /window\.localStorage\.setItem\(landingLocaleStorageKey, nextLocale\)/);
  assert.doesNotMatch(source, /document\.documentElement\.lang/);
});

test('a landing identifica o idioma apresentado e mantém os documentos legais em português', () => {
  assert.match(source, /<main ref=\{pageRef\} lang=\{locale\}/);
  assert.match(source, /Terms of Use \(Portuguese\)/);
  assert.match(source, /Privacy Policy \(Portuguese\)/);
  assert.match(source, /function LanguageSelector/);
  assert.match(source, /function Team\(\{ locale \}: \{ locale: LandingLocale \}\)/);
});

test('a landing substitui Ecossistema por uma experiência de soluções sem reintroduzir áreas removidas', () => {
  assert.match(source, /\['Funcionalidades', '#funcionalidades'\]/);
  assert.match(source, /<WhyChooseSection locale=\{locale\} \/>/);
  assert.doesNotMatch(source, /Ecossistema e iniciativas relacionadas/);
  assert.doesNotMatch(source, /landing-logo-marquee/);
  assert.doesNotMatch(source, /id="assistente"/);
  assert.doesNotMatch(source, /id="documentos"/);
  assert.doesNotMatch(source, /id="plataforma"/);
  assert.doesNotMatch(source, /function DocumentDemo/);
  assert.match(whyChooseSource, /Porquê escolher a Fiscalidade Digital\?/);
  assert.match(whyChooseSource, /Porque a sua empresa merece mais tempo para crescer/);
  assert.match(whyChooseSource, /Serviços especializados/);
  assert.match(whyChooseSource, /Consultoria fiscal/);
  assert.match(whyChooseSource, /role="tablist"/);
  assert.match(whyChooseSource, /overflow-x-auto/);
  assert.match(whyChooseSource, /useReducedMotion/);
});
