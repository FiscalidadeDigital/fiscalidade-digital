'use client';

import { useState } from 'react';

const faqs = [
  {
    question: 'O que é o Fiscalidade Digital?',
    answer:
      'É uma plataforma para centralizar e organizar informação, obrigações e tarefas relacionadas com a gestão fiscal da empresa.',
  },
  {
    question: 'A plataforma funciona online?',
    answer:
      'Sim. A plataforma foi desenvolvida para ser utilizada através do navegador, permitindo acesso à informação a partir do local de trabalho.',
  },
  {
    question: 'Posso utilizar para a minha empresa?',
    answer:
      'A plataforma foi pensada para empresas de diferentes dimensões. A disponibilidade de cada funcionalidade pode depender da configuração da conta.',
  },
  {
    question: 'A plataforma substitui um contabilista?',
    answer:
      'Não. O sistema serve como ferramenta de organização, acompanhamento e apoio à gestão. A responsabilidade pelo tratamento contabilístico e fiscal continua a caber aos profissionais e responsáveis da empresa.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="py-24 lg:py-28 bg-white"
    >
      <div className="max-w-3xl mx-auto px-6">

        <div className="text-center mb-12">

          <div className="
            text-xs
            font-semibold
            text-blue-700
            uppercase
            tracking-wide
            mb-3
          ">
            Perguntas frequentes
          </div>

          <h2 className="
            text-3xl
            sm:text-4xl
            font-bold
            text-slate-950
            tracking-tight
          ">
            Tem alguma dúvida?
          </h2>

          <p className="
            mt-4
            text-slate-600
          ">
            Algumas respostas sobre a plataforma.
          </p>

        </div>

        <div className="
          border
          border-slate-200
          rounded-2xl
          overflow-hidden
        ">

          {faqs.map((faq, index) => {
            const isOpen = open === index;

            return (
              <div
                key={faq.question}
                className="border-b last:border-b-0 border-slate-200"
              >

                <button
                  type="button"
                  onClick={() =>
                    setOpen(isOpen ? null : index)
                  }
                  className="
                    w-full
                    px-6
                    py-5
                    text-left
                    flex
                    items-center
                    justify-between
                    gap-6
                    hover:bg-slate-50
                    transition
                  "
                >

                  <span className="
                    text-sm
                    font-semibold
                    text-slate-900
                  ">
                    {faq.question}
                  </span>

                  <span className="
                    text-xl
                    text-slate-400
                    shrink-0
                  ">
                    {isOpen ? '−' : '+'}
                  </span>

                </button>

                {isOpen && (
                  <div className="
                    px-6
                    pb-5
                    text-sm
                    leading-7
                    text-slate-600
                  ">
                    {faq.answer}
                  </div>
                )}

              </div>
            );
          })}

        </div>

      </div>
    </section>
  );
}