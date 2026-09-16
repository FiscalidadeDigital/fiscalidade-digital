'use client';

import {
  Bot,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

interface Props {
  message?: string;
  recommendations?: string[];
}

export default function AIInsights({
  message,
  recommendations = [],
}: Props) {
  return (
    <div className="
      rounded-2xl
      border
      border-indigo-100
      bg-gradient-to-br
      from-indigo-50
      to-white
      p-6
      shadow-sm
    ">

      <div className="flex items-center gap-3">

        <div className="
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-xl
          bg-indigo-600
          text-white
        ">
          <Bot size={22} />
        </div>

        <div>
          <h3 className="font-bold text-slate-900">
            Assistente Fiscal
          </h3>

          <p className="text-xs text-slate-500">
            Análise da sua empresa
          </p>
        </div>

      </div>

      <div className="mt-5">

        {message ? (
          <p className="text-sm leading-6 text-slate-700">
            {message}
          </p>
        ) : (
          <p className="text-sm text-slate-500">
            Ainda não existem insights fiscais
            disponíveis para esta empresa.
          </p>
        )}

      </div>

      {recommendations.length > 0 && (
        <div className="mt-5 space-y-3">

          {recommendations
            .slice(0, 4)
            .map((item, index) => (
              <div
                key={index}
                className="
                  flex
                  gap-3
                  rounded-xl
                  bg-white
                  p-3
                  shadow-sm
                "
              >

                <AlertTriangle
                  size={17}
                  className="mt-0.5 text-orange-500"
                />

                <p className="text-xs text-slate-600">
                  {item}
                </p>

              </div>
            ))}

        </div>
      )}

      <div className="
        mt-5
        flex
        items-center
        gap-2
        text-[11px]
        text-indigo-500
      ">
        <Sparkles size={13} />
        Dados baseados na actividade fiscal da empresa
      </div>

    </div>
  );
}