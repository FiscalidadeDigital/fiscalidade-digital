/**
 * Funções puras para apresentar respostas do Assistente Fiscal sem confiar em
 * HTML ou Markdown executável vindo do serviço de IA.
 */

const citationPattern = /\[([WL]\d+)\]/g;
const inlinePattern = /(\*\*([^*\n]+)\*\*|\[([WL]\d+)\])/g;
const privateDisclosurePattern = /\b(?:openai|chatgpt|gpt(?:[-_.\w]+)?|api|endpoint|backend|servidor|prompt|credencial(?:is)?|chave(?:s)?(?:\s+de\s+(?:api|acesso))?|token(?:s)?|modelo\s+(?:de\s+)?(?:linguagem|ia)|intelig[eê]ncia\s+artificial|\bia\b|prisma|sql|stack\s*trace|exception|econn\w+)\b/i;
const genericAssistantWarning =
  'Algumas fontes de consulta estão temporariamente indisponíveis.';
const genericAssistantAnswer =
  'Não foi possível apresentar uma resposta neste momento. Tente novamente.';

function textToken(value) {
  return { type: 'text', value: String(value || '').replace(/\*\*/g, '') };
}

function parseInlineContent(value) {
  const text = String(value || '');
  const tokens = [];
  let cursor = 0;
  let match;

  while ((match = inlinePattern.exec(text))) {
    if (match.index > cursor) {
      tokens.push(textToken(text.slice(cursor, match.index)));
    }

    if (match[2]) {
      tokens.push({ type: 'strong', value: match[2] });
    } else {
      tokens.push({ type: 'citation', id: match[3] });
    }

    cursor = match.index + match[0].length;
  }

  if (cursor < text.length || !tokens.length) {
    tokens.push(textToken(text.slice(cursor)));
  }

  return tokens.filter((token) => token.type !== 'text' || token.value);
}

/**
 * Preserva apenas a pequena estrutura que a interface suporta: parágrafos,
 * listas e negrito. Ligações e HTML no texto permanecem texto simples.
 */
function parseAssistantContent(value) {
  const blocks = [];
  const lines = String(value || '')
    .replace(/\r\n?/g, '\n')
    .split('\n');
  let list = null;

  const flushList = () => {
    if (list?.items.length) blocks.push(list);
    list = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const bullet = line.match(/^(?:[-*•]\s+)(.+)$/);
    const ordered = line.match(/^\d+[.)]\s+(.+)$/);

    if (bullet || ordered) {
      const type = ordered ? 'ordered-list' : 'unordered-list';
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push(parseInlineContent((bullet || ordered)[1]));
      continue;
    }

    flushList();
    if (line) {
      blocks.push({ type: 'paragraph', tokens: parseInlineContent(line) });
    }
  }

  flushList();
  return blocks;
}

function safeExternalUrl(value) {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol)
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

function sourceById(sources) {
  return new Map(
    (Array.isArray(sources) ? sources : [])
      .filter((source) => source && typeof source.id === 'string')
      .map((source) => [source.id, source]),
  );
}

function citationIds(value) {
  return [...String(value || '').matchAll(citationPattern)].map(
    (match) => match[1],
  );
}

function assistantErrorMessage(error) {
  const status = Number(error?.response?.status) || 0;
  const code = String(error?.code || '').toUpperCase();
  const message = String(error?.message || '').toLowerCase();

  if (status === 401) {
    return 'A sua sessão terminou. Inicie sessão novamente antes de continuar.';
  }
  if (status === 403) {
    return 'Não tem acesso ao Assistente Fiscal nesta empresa. Confirme a sua sessão e permissões.';
  }
  if (status === 429) {
    return 'O limite temporário de consultas foi atingido. Aguarde alguns instantes antes de tentar novamente.';
  }
  if (status === 503) {
    return 'O serviço de assistência está temporariamente indisponível. Tente novamente mais tarde.';
  }
  if (
    code === 'ECONNABORTED' ||
    code === 'ETIMEDOUT' ||
    message.includes('timeout') ||
    message.includes('timed out')
  ) {
    return 'A consulta demorou demasiado tempo. Verifique a ligação e tente novamente.';
  }
  if (!status) {
    return 'Não foi possível estabelecer ligação ao serviço. Verifique a sua internet e tente novamente.';
  }
  return 'Não foi possível obter uma resposta neste momento. Tente novamente.';
}

function assistantAnswer(value) {
  const answer = String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!answer || privateDisclosurePattern.test(answer)) {
    return genericAssistantAnswer;
  }

  return answer.slice(0, 6000);
}

function assistantWarnings(values) {
  const hasWarning = (Array.isArray(values) ? values : [])
    .filter((value) => typeof value === 'string')
    .map((value) => value.replace(/[\u0000-\u001F\u007F]/g, ' ').trim())
    .some(Boolean);

  return hasWarning ? [genericAssistantWarning] : [];
}

module.exports = {
  assistantAnswer,
  assistantErrorMessage,
  assistantWarnings,
  citationIds,
  parseAssistantContent,
  parseInlineContent,
  safeExternalUrl,
  sourceById,
};
