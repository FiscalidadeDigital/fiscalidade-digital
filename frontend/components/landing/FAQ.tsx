'use client';

import { useState } from 'react';

export default function FAQ() {
  const faqs = [
    {
      question:
        'O sistema é seguro?',
      answer:
        'Sim. Todos os dados são protegidos por mecanismos modernos de segurança.',
    },
    {
      question:
        'Posso usar em qualquer empresa?',
      answer:
        'Sim. O sistema adapta-se a pequenas, médias e grandes empresas.',
    },
    {
      question:
        'Funciona online?',
      answer:
        'Sim. Pode aceder de qualquer lugar através da internet.',
    },
    {
      question:
        'Ajuda a evitar multas?',
      answer:
        'Sim. O sistema envia alertas automáticos de obrigações fiscais.',
    },
  ];

  const [open, setOpen] =
    useState<number | null>(0);

  return (
    <section
      id="faq"
      className="py-28 bg-slate-50"
    >
      <div className="max-w-4xl mx-auto px-6">

        <h2 className="text-5xl font-black text-center mb-16">
          Perguntas Frequentes
        </h2>

        <div className="space-y-4">

          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
            >
              <button
                onClick={() =>
                  setOpen(
                    open === index
                      ? null
                      : index,
                  )
                }
                className="w-full p-6 flex justify-between items-center"
              >
                <span className="font-semibold">
                  {faq.question}
                </span>

                <span>
                  {open === index
                    ? '−'
                    : '+'}
                </span>
              </button>

              {open === index && (
                <div className="px-6 pb-6 text-slate-600">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}