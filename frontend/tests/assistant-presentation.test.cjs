const assert = require('node:assert/strict');
const test = require('node:test');

const {
  assistantErrorMessage,
  assistantWarnings,
  citationIds,
  parseAssistantContent,
  safeExternalUrl,
  sourceById,
} = require('../lib/assistant-presentation.js');

test('apresenta negrito, listas e citações sem interpretar HTML', () => {
  const blocks = parseAssistantContent(
    'A **taxa** aplicável é consultada na fonte [W1].\n\n- Primeiro passo\n- Segundo <img src=x onerror=alert(1)> [L1]\n\n1. Rever o documento',
  );

  assert.deepEqual(blocks, [
    {
      type: 'paragraph',
      tokens: [
        { type: 'text', value: 'A ' },
        { type: 'strong', value: 'taxa' },
        { type: 'text', value: ' aplicável é consultada na fonte ' },
        { type: 'citation', id: 'W1' },
        { type: 'text', value: '.' },
      ],
    },
    {
      type: 'unordered-list',
      items: [
        [{ type: 'text', value: 'Primeiro passo' }],
        [
          {
            type: 'text',
            value: 'Segundo <img src=x onerror=alert(1)> ',
          },
          { type: 'citation', id: 'L1' },
        ],
      ],
    },
    {
      type: 'ordered-list',
      items: [[{ type: 'text', value: 'Rever o documento' }]],
    },
  ]);
});

test('remove marcadores de negrito incompletos e mantém apenas citações conhecidas como identificadores', () => {
  const blocks = parseAssistantContent('Texto **incompleto e [W2].');
  assert.equal(blocks[0].tokens.map((token) => token.value || token.id).join(''), 'Texto incompleto e W2.');
  assert.deepEqual(citationIds('Ver [W1], [L2] e [X3].'), ['W1', 'L2']);
});

test('aceita somente URLs externas http(s) e indexa as fontes devolvidas pelo serviço', () => {
  assert.equal(safeExternalUrl('https://agt.minfin.gov.ao/iva'), 'https://agt.minfin.gov.ao/iva');
  assert.equal(safeExternalUrl('javascript:alert(1)'), null);
  assert.equal(safeExternalUrl('/relativa'), null);

  const sources = sourceById([
    { id: 'W1', title: 'AGT', sourceUrl: 'https://agt.minfin.gov.ao/iva' },
    { id: 'L1', title: 'Lei do IVA', sourceUrl: null },
  ]);
  assert.equal(sources.get('W1').title, 'AGT');
  assert.equal(sources.get('L1').title, 'Lei do IVA');
});

test('distingue os estados de falha sem expor detalhes técnicos ao utilizador', () => {
  assert.match(assistantErrorMessage({ response: { status: 401 } }), /sessão terminou/i);
  assert.match(assistantErrorMessage({ response: { status: 403 } }), /Não tem acesso/i);
  assert.match(assistantErrorMessage({ response: { status: 429 } }), /limite temporário/i);
  assert.match(assistantErrorMessage({ response: { status: 503 } }), /temporariamente indisponível/i);
  assert.match(assistantErrorMessage({ code: 'ECONNABORTED' }), /demorou demasiado tempo/i);
  assert.match(assistantErrorMessage({ request: {} }), /estabelecer ligação/i);
  assert.match(assistantErrorMessage({ response: { status: 500 } }), /Não foi possível obter/i);
});

test('não expõe detalhes de configuração em avisos da resposta', () => {
  assert.deepEqual(
    assistantWarnings([
      'OPENAI_API_KEY: REQUIRES_CONFIGURATION',
      'A pesquisa pública está indisponível.',
      'A pesquisa pública está indisponível.',
    ]),
    [
      'Algumas fontes de consulta estão temporariamente indisponíveis.',
      'A pesquisa pública está indisponível.',
    ],
  );
});
