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
        className="fixed bottom-5 right-5 z-[999] grid h-14 w-14 place-items-center rounded-full bg-[#071A2F] text-cyan-200 shadow-xl ring-1 ring-cyan-300/30 transition hover:bg-[#0b2a49] focus:outline-none focus:ring-2 focus:ring-cyan-400 sm:bottom-6 sm:right-6"
      >
        <Bot size={24} />
      </button>
      {open && (
        <section
          role="dialog"
          aria-modal="true"
          aria-label="Assistente Fiscal"
          className="fixed inset-x-2 bottom-2 z-[1000] flex h-[calc(100dvh-1rem)] max-h-[760px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[min(680px,78dvh)] sm:w-[400px]"
        >
          <header className="flex items-center justify-between bg-[#071A2F] px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-400/15 text-cyan-200">
                <Bot size={19} />
              </span>
              <div>
                <h2 className="text-sm font-bold">Assistente Fiscal</h2>
                <p className="text-[11px] text-slate-300">
                  Informação fiscal baseada nos dados da sua empresa.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar Assistente Fiscal"
              className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white"
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
                <p className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
                  Olá. Como posso ajudar com a gestão fiscal da sua empresa?
                </p>
                <div className="space-y-2">
                  {suggestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => void sendMessage(item)}
                      className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-xs text-[#0b6f93] hover:bg-slate-50"
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
                    ? 'ml-8 rounded-xl bg-[#102447] p-3 text-sm text-white'
                    : 'mr-4 rounded-xl bg-slate-100 p-3 text-sm leading-6 text-slate-700'
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
            className="border-t border-slate-200 p-3"
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
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#0b6f93] text-white disabled:opacity-40"
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
