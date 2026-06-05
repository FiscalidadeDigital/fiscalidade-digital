'use client';

import { useState } from 'react';

export default function FiscalAssistant() {
  const [message, setMessage] =
    useState('');

  const [messages, setMessages] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(false);

  async function sendMessage() {
    if (!message.trim()) return;

    const userMessage = {
      role: 'user',
      content: message,
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
    ]);

    setLoading(true);

    const response = await fetch(
      'http://localhost:3001/ai/chat',
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify({
          message,
        }),
      },
    );

    const data =
      await response.json();

    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: data.answer,
      },
    ]);

    setMessage('');
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl h-[700px] flex flex-col">

      <div className="p-4 border-b">
        <h2 className="font-bold text-xl">
          Assistente Fiscal IA
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {messages.map((msg, index) => (
          <div
            key={index}
            className={
              msg.role === 'user'
                ? 'text-right'
                : 'text-left'
            }
          >
            <div
              className={
                msg.role === 'user'
                  ? 'bg-blue-600 text-white inline-block px-4 py-2 rounded-2xl'
                  : 'bg-slate-100 inline-block px-4 py-2 rounded-2xl'
              }
            >
              {msg.content}
            </div>
          </div>
        ))}

      </div>

      <div className="p-4 border-t flex gap-3">

        <input
          value={message}
          onChange={(e) =>
            setMessage(
              e.target.value,
            )
          }
          className="flex-1 border rounded-xl px-4 py-3"
          placeholder="Pergunte qualquer coisa..."
        />

        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-6 rounded-xl"
        >
          Enviar
        </button>

      </div>
    </div>
  );
}