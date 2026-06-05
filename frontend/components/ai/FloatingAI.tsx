'use client';

import { useState } from 'react';
import axios from 'axios';

export default function FloatingAI() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [answer, setAnswer] = useState('');

  async function sendMessage() {
    if (!message.trim()) return;

    try {
      const token =
        localStorage.getItem('token');

      const response =
        await axios.post(
          'http://localhost:3001/ai/chat',
          {
            message,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

      setAnswer(response.data.answer);
    } catch (error) {
      console.error(error);

      setAnswer(
        'Erro ao comunicar com a Fiscalidade AI.',
      );
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-blue-600 text-white shadow-2xl z-50"
      >
        AI
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 w-96 bg-white rounded-2xl shadow-2xl p-5 z-50">
          <h3 className="font-bold text-lg mb-4">
            Fiscalidade AI
          </h3>

          <textarea
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            placeholder="Faça uma pergunta..."
            className="w-full border rounded-lg p-3 h-28"
          />

          <button
            onClick={sendMessage}
            className="mt-3 w-full bg-blue-600 text-white py-3 rounded-lg"
          >
            Enviar Mensagem
          </button>

          {answer && (
            <div className="mt-4 p-3 bg-slate-100 rounded-lg whitespace-pre-wrap">
              {answer}
            </div>
          )}
        </div>
      )}
    </>
  );
}