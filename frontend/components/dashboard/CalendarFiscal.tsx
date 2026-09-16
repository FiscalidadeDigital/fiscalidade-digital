'use client';

import { useMemo, useState } from 'react';

import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ArrowRight,
} from 'lucide-react';

/* =====================================================
   TIPOS
===================================================== */

interface Deadline {
  date: string;
  title: string;
  description?: string;
  daysLeft?: number;

  status?:
    | 'today'
    | 'warning'
    | 'normal'
    | 'success';
}

/* =====================================================
   PROPS
===================================================== */

interface CalendarFiscalProps {
  deadlines: Deadline[];
}

/* =====================================================
   COMPONENTE
===================================================== */

export default function CalendarFiscal({
  deadlines,
}: CalendarFiscalProps) {

  /* ===================================================
     ESTADO
  =================================================== */

  const [currentDate, setCurrentDate] =
    useState(() => new Date());

  /* ===================================================
     DATA DE HOJE
  =================================================== */

  const today = useMemo(() => {
    const date = new Date();

    return [
      date.getFullYear(),
      String(
        date.getMonth() + 1,
      ).padStart(2, '0'),
      String(
        date.getDate(),
      ).padStart(2, '0'),
    ].join('-');
  }, []);

  /* ===================================================
     MÊS / ANO
  =================================================== */

  const currentYear =
    currentDate.getFullYear();

  const currentMonth =
    currentDate.getMonth();

  const monthName =
    currentDate.toLocaleDateString(
      'pt-PT',
      {
        month: 'long',
        year: 'numeric',
      },
    );

  /* ===================================================
     GERAR CALENDÁRIO
  =================================================== */

  const days = useMemo(() => {
    const year =
      currentDate.getFullYear();

    const month =
      currentDate.getMonth();

    /*
     * Domingo = 0
     * Segunda = 1
     * ...
     *
     * Como o calendário começa na Segunda,
     * fazemos a conversão.
     */

    const firstDay =
      new Date(
        year,
        month,
        1,
      ).getDay();

    const adjustedFirstDay =
      firstDay === 0
        ? 6
        : firstDay - 1;

    /*
     * Número de dias do mês
     */

    const totalDays =
      new Date(
        year,
        month + 1,
        0,
      ).getDate();

    const result: {
      day: number;
      current: boolean;
      date: string;
    }[] = [];

    /*
     * ===============================================
     * DIAS DO MÊS ANTERIOR
     * ===============================================
     */

    for (
      let i = adjustedFirstDay - 1;
      i >= 0;
      i--
    ) {
      const date =
        new Date(
          year,
          month,
          -i,
        );

      result.push({
        day:
          date.getDate(),

        current: false,

        date: formatDate(
          date,
        ),
      });
    }

    /*
     * ===============================================
     * DIAS DO MÊS ATUAL
     * ===============================================
     */

    for (
      let day = 1;
      day <= totalDays;
      day++
    ) {
      const date =
        new Date(
          year,
          month,
          day,
        );

      result.push({
        day,

        current: true,

        date: formatDate(
          date,
        ),
      });
    }

    /*
     * ===============================================
     * DIAS DO PRÓXIMO MÊS
     *
     * Mantemos 42 células para o calendário
     * ter sempre a mesma altura.
     * ===============================================
     */

    let nextMonthDay = 1;

    while (
      result.length < 42
    ) {
      const date =
        new Date(
          year,
          month + 1,
          nextMonthDay,
        );

      result.push({
        day:
          date.getDate(),

        current: false,

        date: formatDate(
          date,
        ),
      });

      nextMonthDay++;
    }

    return result;
  }, [currentDate]);

  /* ===================================================
     MUDAR MÊS
  =================================================== */

  function changeMonth(
    amount: number,
  ) {
    setCurrentDate(
      new Date(
        currentYear,
        currentMonth + amount,
        1,
      ),
    );
  }

  /* ===================================================
     VOLTAR PARA HOJE
  =================================================== */

  function goToToday() {
    setCurrentDate(
      new Date(),
    );
  }

  /* ===================================================
     ENCONTRAR PRAZO NO DIA
  =================================================== */

  function getDeadline(
    date: string,
  ) {
    return deadlines.find(
      (item) =>
        item.date.startsWith(
          date,
        ),
    );
  }

  /* ===================================================
     COR DO INDICADOR
  =================================================== */

  function getDeadlineDot(
    status?: Deadline['status'],
  ) {
    switch (status) {

      case 'today':
        return 'bg-[#5146e5]';

      case 'warning':
        return 'bg-[#f59e0b]';

      case 'success':
        return 'bg-[#10b981]';

      case 'normal':
      default:
        return 'bg-[#ef4444]';
    }
  }

  /* ===================================================
     FILTRAR / ORDENAR PRÓXIMOS PRAZOS
  =================================================== */

  const upcomingDeadlines =
    useMemo(() => {

      return [...deadlines]
        .sort(
          (
            a,
            b,
          ) => {

            const aDays =
              a.daysLeft ??
              Number.MAX_SAFE_INTEGER;

            const bDays =
              b.daysLeft ??
              Number.MAX_SAFE_INTEGER;

            /*
             * Prazos futuros primeiro.
             */

            if (
              aDays >= 0 &&
              bDays < 0
            ) {
              return -1;
            }

            if (
              aDays < 0 &&
              bDays >= 0
            ) {
              return 1;
            }

            /*
             * Futuras:
             * mais próximas primeiro.
             */

            if (
              aDays >= 0 &&
              bDays >= 0
            ) {
              return (
                aDays -
                bDays
              );
            }

            /*
             * Vencidas:
             * mais recentes primeiro.
             */

            return (
              new Date(
                b.date,
              ).getTime() -
              new Date(
                a.date,
              ).getTime()
            );
          },
        )
        .slice(0, 6);

    }, [deadlines]);

  /* ===================================================
     RENDER
  =================================================== */

  return (
    <div
      className="
        w-full
        overflow-hidden
        rounded-3xl
        border
        border-[#e7eaf1]
        bg-white
        shadow-sm
      "
    >

      {/* =================================================
          CABEÇALHO
      ================================================= */}

      <div
        className="
          flex
          flex-col
          gap-4
          border-b
          border-[#edf0f5]
          px-5
          py-5
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:px-6
        "
      >

        {/* TÍTULO */}

        <div
          className="
            flex
            min-w-0
            items-center
            gap-3
          "
        >

          <div
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-[#f0edff]
              text-[#5146e5]
            "
          >
            <CalendarDays
              size={20}
              strokeWidth={2}
            />
          </div>

          <div
            className="
              min-w-0
            "
          >

            <h3
              className="
                text-[15px]
                font-bold
                text-[#111b3b]
              "
            >
              Calendário Fiscal
            </h3>

            <p
              className="
                mt-0.5
                text-[11px]
                text-[#7180a2]
              "
            >
              Acompanhe os seus próximos prazos
            </p>

          </div>

        </div>

        {/* AÇÕES */}

        <div
          className="
            flex
            items-center
            gap-2
            shrink-0
          "
        >

          <button
            type="button"
            onClick={
              goToToday
            }
            className="
              hidden
              sm:inline-flex
              h-9
              items-center
              justify-center
              rounded-lg
              border
              border-[#e4e7ef]
              bg-white
              px-3
              text-[10px]
              font-semibold
              text-[#64708a]
              transition
              hover:bg-[#f8f7ff]
              hover:text-[#5146e5]
            "
          >
            Hoje
          </button>

          <button
            type="button"
            className="
              inline-flex
              h-9
              items-center
              gap-1.5
              rounded-lg
              border
              border-[#e4e7ef]
              bg-white
              px-3
              text-[10px]
              font-semibold
              text-[#5146e5]
              transition
              hover:bg-[#f8f7ff]
            "
          >
            Ver tudo

            <ArrowRight
              size={13}
            />
          </button>

        </div>

      </div>

      {/* =================================================
          CONTEÚDO PRINCIPAL
      ================================================= */}

      <div
        className="
          p-4
          sm:p-5
          lg:p-6
        "
      >

        <div
          className="
            grid
            grid-cols-1
            gap-5
            lg:grid-cols-[300px_minmax(0,1fr)]
            xl:grid-cols-[320px_minmax(0,1fr)]
          "
        >

          {/* =================================================
              CALENDÁRIO
          ================================================= */}

          <div
            className="
              min-w-0
              rounded-2xl
              border
              border-[#e9ecf2]
              bg-[#fbfcfe]
              p-4
              sm:p-5
            "
          >

            {/* CONTROLO DO MÊS */}

            <div
              className="
                mb-4
                grid
                grid-cols-[36px_minmax(0,1fr)_36px]
                items-center
                gap-2
              "
            >

              <button
                type="button"
                onClick={() =>
                  changeMonth(-1)
                }
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  border
                  border-[#e2e6ee]
                  bg-white
                  text-[#526080]
                  transition
                  hover:bg-[#f3f4f8]
                "
                aria-label="Mês anterior"
              >
                <ChevronLeft
                  size={16}
                />
              </button>

              <button
                type="button"
                onClick={
                  goToToday
                }
                className="
                  min-w-0
                  text-center
                "
              >

                <h4
                  className="
                    truncate
                    text-[14px]
                    font-extrabold
                    capitalize
                    text-[#17213f]
                  "
                >
                  {monthName}
                </h4>

                <p
                  className="
                    mt-0.5
                    text-[9px]
                    font-medium
                    text-[#9aa4b8]
                  "
                >
                  {currentYear}
                </p>

              </button>

              <button
                type="button"
                onClick={() =>
                  changeMonth(1)
                }
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  border
                  border-[#e2e6ee]
                  bg-white
                  text-[#526080]
                  transition
                  hover:bg-[#f3f4f8]
                "
                aria-label="Próximo mês"
              >
                <ChevronRight
                  size={16}
                />
              </button>

            </div>

            {/* DIAS DA SEMANA */}

            <div
              className="
                grid
                grid-cols-7
                border-b
                border-[#edf0f5]
                pb-1
              "
            >

              {[
                'SEG',
                'TER',
                'QUA',
                'QUI',
                'SEX',
                'SÁB',
                'DOM',
              ].map(
                (day) => (
                  <div
                    key={day}
                    className="
                      flex
                      h-7
                      min-w-0
                      items-center
                      justify-center
                      text-center
                      text-[8px]
                      font-extrabold
                      tracking-wide
                      text-[#929caf]
                    "
                  >
                    {day}
                  </div>
                ),
              )}

            </div>

            {/* DIAS */}

            <div
              className="
                mt-1
                grid
                grid-cols-7
              "
            >

              {days.map(
                (
                  item,
                  index,
                ) => {

                  const deadline =
                    getDeadline(
                      item.date,
                    );

                  const isToday =
                    item.date ===
                    today;

                  return (
                    <div
                      key={`${item.date}-${index}`}
                      className="
                        relative
                        flex
                        h-10
                        min-w-0
                        items-center
                        justify-center
                      "
                    >

                      <div
                        className={`
                          relative
                          flex
                          h-8
                          w-8
                          items-center
                          justify-center
                          rounded-full
                          text-[11px]
                          font-medium
                          transition
                          ${
                            !item.current
                              ? 'text-[#c7ccda]'
                              : 'text-[#354361]'
                          }
                          ${
                            isToday
                              ? `
                                bg-[#5146e5]
                                font-extrabold
                                text-white
                                shadow-sm
                              `
                              : ''
                          }
                        `}
                      >
                        {item.day}

                        {/* INDICADOR */}

                        {deadline &&
                          !isToday && (
                            <span
                              className={`
                                absolute
                                bottom-0
                                left-1/2
                                h-1.5
                                w-1.5
                                -translate-x-1/2
                                rounded-full
                                ${getDeadlineDot(
                                  deadline.status,
                                )}
                              `}
                            />
                          )}
                      </div>

                    </div>
                  );
                },
              )}

            </div>

            {/* LEGENDA */}

            <div
              className="
                mt-4
                flex
                flex-wrap
                items-center
                gap-x-4
                gap-y-2
                border-t
                border-[#edf0f5]
                pt-4
              "
            >

              <LegendItem
                color="bg-[#5146e5]"
                label="Hoje"
              />

              <LegendItem
                color="bg-[#f59e0b]"
                label="Atenção"
              />

              <LegendItem
                color="bg-[#10b981]"
                label="Em dia"
              />

            </div>

          </div>

          {/* =================================================
              PRÓXIMOS PRAZOS
          ================================================= */}

          <div
            className="
              min-w-0
            "
          >

            {/* CABEÇALHO DA LISTA */}

            <div
              className="
                mb-3
                flex
                items-center
                justify-between
                gap-3
              "
            >

              <div
                className="
                  min-w-0
                "
              >

                <h4
                  className="
                    text-[14px]
                    font-bold
                    text-[#17213f]
                  "
                >
                  Próximos Prazos
                </h4>

                <p
                  className="
                    mt-1
                    text-[10px]
                    text-[#8a96b0]
                  "
                >
                  Obrigações que exigem atenção
                </p>

              </div>

              {deadlines.length >
                0 && (
                <span
                  className="
                    shrink-0
                    rounded-full
                    bg-[#f0edff]
                    px-2.5
                    py-1
                    text-[9px]
                    font-bold
                    text-[#5146e5]
                  "
                >
                  {deadlines.length}
                </span>
              )}

            </div>

            {/* SEM PRAZOS */}

            {upcomingDeadlines.length ===
              0 && (
              <div
                className="
                  flex
                  min-h-[250px]
                  flex-col
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-dashed
                  border-[#dfe3ec]
                  bg-[#fbfcfe]
                  p-6
                  text-center
                "
              >

                <div
                  className="
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-xl
                    bg-[#f0edff]
                    text-[#5146e5]
                  "
                >
                  <CalendarDays
                    size={22}
                  />
                </div>

                <p
                  className="
                    mt-3
                    text-sm
                    font-semibold
                    text-[#5e6b85]
                  "
                >
                  Não existem prazos registados.
                </p>

                <p
                  className="
                    mt-1
                    text-[10px]
                    text-[#9aa4b8]
                  "
                >
                  O calendário fiscal da sua empresa aparecerá aqui.
                </p>

              </div>
            )}

            {/* LISTA */}

            {upcomingDeadlines.length >
              0 && (
              <div
                className="
                  max-h-[390px]
                  space-y-2.5
                  overflow-y-auto
                  pr-1
                "
              >

                {upcomingDeadlines.map(
                  (
                    deadline,
                    index,
                  ) => {

                    const date =
                      new Date(
                        deadline.date,
                      );

                    const day =
                      date.getDate();

                    const month =
                      date.toLocaleDateString(
                        'pt-PT',
                        {
                          month:
                            'short',
                        },
                      );

                    const daysLeft =
                      deadline.daysLeft;

                    const isOverdue =
                      typeof daysLeft ===
                        'number' &&
                      daysLeft < 0;

                    const isToday =
                      daysLeft ===
                      0;

                    const isWarning =
                      typeof daysLeft ===
                        'number' &&
                      daysLeft > 0 &&
                      daysLeft <= 3;

                    return (
                      <div
                        key={`${deadline.date}-${deadline.title}-${index}`}
                        className="
                          group
                          grid
                          grid-cols-[58px_minmax(0,1fr)_auto]
                          items-center
                          gap-3
                          rounded-xl
                          border
                          border-[#e9ecf2]
                          bg-white
                          px-3
                          py-3
                          transition
                          hover:border-[#d9d5ff]
                          hover:bg-[#fcfbff]
                        "
                      >

                        {/* DATA */}

                        <div
                          className="
                            flex
                            h-[52px]
                            w-[58px]
                            shrink-0
                            flex-col
                            items-center
                            justify-center
                            rounded-xl
                            bg-[#f0edff]
                          "
                        >

                          <span
                            className="
                              text-[15px]
                              font-extrabold
                              leading-none
                              text-[#5146e5]
                            "
                          >
                            {day}
                          </span>

                          <span
                            className="
                              mt-1
                              text-[8px]
                              font-bold
                              uppercase
                              tracking-wide
                              text-[#7069c7]
                            "
                          >
                            {month}
                          </span>

                        </div>

                        {/* INFORMAÇÃO */}

                        <div
                          className="
                            min-w-0
                          "
                        >

                          <h5
                            className="
                              line-clamp-2
                              text-[11px]
                              font-bold
                              leading-4
                              text-[#25365f]
                            "
                            title={
                              deadline.title
                            }
                          >
                            {deadline.title}
                          </h5>

                          <p
                            className="
                              mt-1
                              truncate
                              text-[9px]
                              leading-4
                              text-[#8994a9]
                            "
                            title={
                              deadline.description ||
                              ''
                            }
                          >
                            {deadline.description ||
                              'Obrigação fiscal conforme calendário oficial da AGT.'}
                          </p>

                        </div>

                        {/* STATUS */}

                        <div
                          className="
                            flex
                            shrink-0
                            items-center
                            justify-end
                          "
                        >

                          {typeof daysLeft ===
                            'number' && (

                            <span
                              className={`
                                rounded-lg
                                px-2
                                py-1.5
                                text-[8px]
                                font-extrabold
                                whitespace-nowrap
                                ${
                                  isOverdue
                                    ? 'bg-red-50 text-red-600'
                                    : isToday
                                    ? 'bg-red-50 text-red-600'
                                    : isWarning
                                    ? 'bg-orange-50 text-orange-600'
                                    : 'bg-emerald-50 text-emerald-600'
                                }
                              `}
                            >
                              {isOverdue
                                ? `${Math.abs(
                                    daysLeft,
                                  )}d atrasado`
                                : isToday
                                ? 'Hoje'
                                : isWarning
                                ? `${daysLeft}d`
                                : `${daysLeft}d`}
                            </span>

                          )}

                        </div>

                      </div>
                    );
                  },
                )}

              </div>
            )}

          </div>

        </div>

      </div>

      {/* =================================================
          RODAPÉ / FONTE
      ================================================= */}

      <div
        className="
          flex
          flex-col
          gap-2
          border-t
          border-[#edf0f5]
          bg-[#fcfcfe]
          px-5
          py-3
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:px-6
        "
      >

        <p
          className="
            text-[9px]
            text-[#98a2b5]
          "
        >
          Os prazos apresentados são aplicáveis ao regime fiscal da empresa.
        </p>

        <div
          className="
            flex
            items-center
            gap-2
            shrink-0
          "
        >

          <span
            className="
              h-2
              w-2
              rounded-full
              bg-emerald-500
            "
          />

          <span
            className="
              text-[9px]
              font-semibold
              text-emerald-700
            "
          >
            Fonte oficial: AGT
          </span>

        </div>

      </div>

    </div>
  );
}

/* =====================================================
   LEGENDA
===================================================== */

function LegendItem({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div
      className="
        flex
        items-center
        gap-1.5
      "
    >

      <span
        className={`
          h-2
          w-2
          shrink-0
          rounded-full
          ${color}
        `}
      />

      <span
        className="
          text-[9px]
          font-medium
          text-[#7a86a0]
        "
      >
        {label}
      </span>

    </div>
  );
}

/* =====================================================
   FORMATAR DATA
===================================================== */

function formatDate(
  date: Date,
) {
  return [
    date.getFullYear(),

    String(
      date.getMonth() + 1,
    ).padStart(2, '0'),

    String(
      date.getDate(),
    ).padStart(2, '0'),
  ].join('-');
}