'use client';

import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { Bot, Send, X } from 'lucide-react';
import api from '@/services/api';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    id: string;
    title: string;
    lawNumber?: string | null;
    article?: string | null;
    source?: string | null;
    sourceUrl?: string | null;
  }>;
  warnings?: string[];
};

const suggestions = [
  'Quais obrigações tenho este mês?',
  'Tenho algum prazo próximo?',
  'Explica a minha situação fiscal.',
];

export default function FloatingAI() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (open) inputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  async function sendMessage(value = message) {
    const text = value.trim();
    if (!text || loading || text.length > 2000) return;
    setMessages((previous) => [...previous, { role: 'user', content: text }]);
    setMessage('');
    setLoading(true);
    try {
      const { data } = await api.post('/ai/chat', { message: text });
      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: data.answer,
          sources: data.sources,
          warnings: data.warnings,
        },
      ]);
    } catch {
      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content:
            'Não foi possível obter uma resposta neste momento. Tente novamente.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <>
      <button
        data-testid="fiscal-assistant-launcher"
        data-fiscal-assistant="launcher"
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir Assistente Fiscal"
        title="Assistente Fiscal"
        className="fixed bottom-4 right-4 z-[999] grid h-11 w-11 place-items-center rounded-lg border border-[#183a59] bg-[#071a2f] text-cyan-100 shadow-md transition hover:bg-[#102f4d] focus:outline-none focus:ring-2 focus:ring-cyan-500 sm:bottom-5 sm:right-5"
      >
        <Bot size={24} />
      </button>
      {open && (
        <section
          role="dialog"
          aria-modal="true"
          aria-label="Assistente Fiscal"
          className="fixed inset-0 z-[1000] flex h-[100dvh] flex-col overflow-hidden border border-slate-200 bg-white shadow-xl sm:inset-auto sm:bottom-20 sm:right-5 sm:h-[min(650px,78dvh)] sm:w-[410px] sm:rounded-xl"
        >
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3.5 text-[#13233c]">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-[#e8f4f7] text-[#087da2]">
                <Bot size={19} />
              </span>
              <div>
                <h2 className="text-sm font-bold">Assistente Fiscal</h2>
                <p className="text-[11px] text-slate-500">
                  Consulta assistida e fundamentada
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar Assistente Fiscal"
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <X size={18} />
            </button>
          </header>
          <div
            className="flex-1 space-y-3 overflow-y-auto p-4"
            aria-live="polite"
          >
            {!messages.length && (
              <>
                <p className="border-l-2 border-[#087da2] bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                  Consulte obrigações, prazos e enquadramentos fiscais da
                  empresa.
                </p>
                <div className="space-y-2">
                  {suggestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => void sendMessage(item)}
                      className="block w-full rounded-md border border-slate-200 px-3 py-2.5 text-left text-xs font-medium text-[#0b6f93] hover:border-slate-300 hover:bg-slate-50"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </>
            )}
            {messages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={
                  item.role === 'user'
                    ? 'ml-10 rounded-lg bg-[#102447] px-3 py-2.5 text-sm text-white'
                    : 'mr-3 border-l-2 border-slate-300 bg-slate-50 px-3 py-2.5 text-sm leading-6 text-slate-700'
                }
              >
                {item.content}
                {item.sources?.length ? (
                  <details className="mt-3 text-xs">
                    <summary className="cursor-pointer font-semibold text-[#0b6f93]">
                      Fontes verificadas
                    </summary>
                    <ul className="mt-1 space-y-1">
                      {item.sources.map((source) => (
                        <li key={source.id}>
                          <span className="font-semibold">[{source.id}]</span>{' '}
                          {source.title}
                          {source.lawNumber ? ` — ${source.lawNumber}` : ''}
                          {source.article ? `, ${source.article}` : ''}
                          {source.source ? ` (${source.source})` : ''}
                          {source.sourceUrl ? (
                            <>
                              {' '}
                              —{' '}
                              <a
                                href={source.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-[#0b6f93] hover:underline"
                              >
                                consultar fonte
                              </a>
                            </>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
                {item.warnings?.length ? (
                  <ul className="mt-3 space-y-1 border-t border-amber-200 pt-2 text-xs text-amber-800">
                    {item.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
            {loading && (
              <p className="text-xs text-slate-500">A preparar resposta…</p>
            )}
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage();
            }}
            className="border-t border-slate-200 bg-slate-50 p-3"
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={message}
                maxLength={2000}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
                rows={2}
                placeholder="Pergunte sobre a situação fiscal da sua empresa…"
                className="min-h-10 flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
              />
              <button
                type="submit"
                disabled={loading || !message.trim()}
                aria-label="Enviar mensagem"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#102447] text-white hover:bg-[#18345f] disabled:opacity-40"
              >
                <Send size={17} />
              </button>
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              O Assistente utiliza os dados e regras disponíveis na Fiscalidade
              Digital.
            </p>
          </form>
        </section>
      )}
    </>,
    document.body,
  );
}
