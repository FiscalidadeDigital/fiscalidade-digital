import {
  Injectable,
  Logger,
} from '@nestjs/common';

import { Cron } from '@nestjs/schedule';

import { PrismaService } from '../prisma/prisma.service';
import { MailService } from './mail.service';

@Injectable()
export class AlertsService {
  private readonly logger =
    new Logger(AlertsService.name);

  private readonly alertDays = [
    30,
    15,
    7,
    3,
    1,
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Executa automaticamente todos os dias
   * às 08:00 no horário de Angola.
   */
  @Cron(
    '0 8 * * *',
    {
      name: 'fiscal-deadlines',
      timeZone: 'Africa/Luanda',
    },
  )
  async checkFiscalDeadlines(): Promise<void> {
    this.logger.log(
      'A verificar prazos fiscais...',
    );

    try {
      const obligations =
        await this.prisma.fiscalObligation.findMany({
          where: {
            alertEnabled: true,

            status: {
              not: 'PAID',
            },
          },

          include: {
            tenant: {
              include: {
                companySettings: true,
              },
            },
          },

          orderBy: {
            dueDate: 'asc',
          },
        });

      this.logger.log(
        `${obligations.length} obrigação(ões) encontrada(s) para verificação.`,
      );

      for (const obligation of obligations) {
        await this.processObligation(
          obligation,
        );
      }

      this.logger.log(
        'Verificação de prazos fiscais concluída.',
      );
    } catch (error) {
      this.logger.error(
        'Erro geral ao verificar prazos fiscais.',
        error instanceof Error
          ? error.stack
          : String(error),
      );
    }
  }

  /**
   * Processa uma obrigação individual.
   */
  private async processObligation(
    obligation: any,
  ): Promise<void> {
    try {
      const today =
        this.startOfDay(
          new Date(),
        );

      const dueDate =
        this.startOfDay(
          new Date(
            obligation.dueDate,
          ),
        );

      const diffTime =
        dueDate.getTime() -
        today.getTime();

      const diffDays =
        Math.round(
          diffTime /
            (1000 * 60 * 60 * 24),
        );

      /*
       * Se a obrigação passou do prazo,
       * marcamos como atrasada quando
       * ainda estiver pendente.
       */
      if (
        diffDays < 0 &&
        obligation.status === 'PENDING'
      ) {
        await this.prisma.fiscalObligation.update({
          where: {
            id: obligation.id,
          },

          data: {
            status: 'LATE',
          },
        });

        this.logger.warn(
          `Obrigação atrasada: ${obligation.title}`,
        );

        return;
      }

      /*
       * Só criamos alertas nos marcos definidos.
       */
      if (
        !this.alertDays.includes(
          diffDays,
        )
      ) {
        return;
      }

      /*
       * Verifica as configurações da empresa.
       */
      const settings =
        obligation.tenant
          ?.companySettings;

      const alertsEnabled =
        settings?.fiscalAlertsEnabled !==
          false &&
        settings?.fiscalReminderEnabled !==
          false;

      if (!alertsEnabled) {
        this.logger.log(
          `Alertas desativados para a empresa ${obligation.tenant.name}.`,
        );

        return;
      }

      /*
       * Impede duplicação:
       *
       * obrigação + número de dias
       *
       * só pode existir uma vez.
       */
      const existingAlert =
        await this.prisma.fiscalAlert.findUnique({
          where: {
            obligationId_daysBefore: {
              obligationId:
                obligation.id,

              daysBefore:
                diffDays,
            },
          },
        });

      if (existingAlert) {
        this.logger.log(
          `Alerta já processado: ${obligation.title} - ${diffDays} dias.`,
        );

        return;
      }

      const notificationType =
        this.getNotificationType(
          diffDays,
        );

      const message =
        this.buildMessage(
          obligation.title,
          diffDays,
        );

      /*
       * Criamos primeiro o registo
       * do alerta fiscal.
       */
      const fiscalAlert =
        await this.prisma.fiscalAlert.create({
          data: {
            tenantId:
              obligation.tenantId,

            obligationId:
              obligation.id,

            daysBefore:
              diffDays,

            notificationSent: false,

            emailSent: false,

            emailStatus: null,

            notificationId: null,
          },
        });

      /*
       * 1. NOTIFICAÇÃO INTERNA
       */
      let notificationId:
        | string
        | null = null;

      try {
        const notification =
          await this.prisma.notification.create({
            data: {
              tenantId:
                obligation.tenantId,

              title:
                this.buildTitle(
                  diffDays,
                ),

              message,

              isRead: false,

              notificationType,
            },
          });

        notificationId =
          notification.id;

        await this.prisma.fiscalAlert.update({
          where: {
            id: fiscalAlert.id,
          },

          data: {
            notificationSent: true,

            notificationId:
              notification.id,
          },
        });

        this.logger.log(
          `Notificação criada: ${obligation.title} - ${diffDays} dias.`,
        );
      } catch (error) {
        this.logger.error(
          `Erro ao criar notificação para ${obligation.title}.`,
          error instanceof Error
            ? error.stack
            : String(error),
        );
      }

      /*
       * 2. E-MAIL
       */
      const emailEnabled =
        settings?.emailEnabled !==
        false;

      if (
        emailEnabled &&
        obligation.tenant?.email
      ) {
        const subject =
          `Alerta Fiscal - ${obligation.title}`;

        const body =
          this.buildEmailBody(
            obligation,
            diffDays,
            dueDate,
          );

        try {
          await this.mailService.sendMail(
            obligation.tenant.email,
            subject,
            body,
          );

          /*
           * Registamos o e-mail enviado.
           */
          await this.prisma.emailLog.create({
            data: {
              tenantId:
                obligation.tenantId,

              email:
                obligation.tenant.email,

              subject,

              body,

              status:
                'SENT',
            },
          });

          await this.prisma.fiscalAlert.update({
            where: {
              id: fiscalAlert.id,
            },

            data: {
              emailSent: true,

              emailStatus:
                'SENT',
            },
          });

          this.logger.log(
            `E-mail enviado: ${obligation.tenant.email} - ${obligation.title}.`,
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : String(error);

          /*
           * Mesmo quando o e-mail falha,
           * guardamos o histórico.
           */
          await this.prisma.emailLog.create({
            data: {
              tenantId:
                obligation.tenantId,

              email:
                obligation.tenant.email,

              subject,

              body,

              status:
                'FAILED',
            },
          });

          await this.prisma.fiscalAlert.update({
            where: {
              id: fiscalAlert.id,
            },

            data: {
              emailSent: false,

              emailStatus:
                `FAILED: ${errorMessage}`,
            },
          });

          this.logger.error(
            `Falha ao enviar e-mail para ${obligation.tenant.email}.`,
            error instanceof Error
              ? error.stack
              : String(error),
          );
        }
      } else {
        await this.prisma.fiscalAlert.update({
          where: {
            id: fiscalAlert.id,
          },

          data: {
            emailSent: false,

            emailStatus:
              emailEnabled
                ? 'NO_COMPANY_EMAIL'
                : 'EMAIL_DISABLED',
          },
        });
      }

      /*
       * Atualizamos os campos antigos
       * da obrigação para manter compatibilidade
       * com o restante do sistema.
       */
      await this.prisma.fiscalObligation.update({
        where: {
          id: obligation.id,
        },

        data: {
          reminderSent: true,

          lastReminderAt:
            new Date(),
        },
      });

      this.logger.log(
        `Alerta fiscal processado com sucesso: ${obligation.title} - ${diffDays} dias.`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao processar obrigação ${obligation.title}.`,
        error instanceof Error
          ? error.stack
          : String(error),
      );
    }
  }

  /**
   * Permite executar a verificação manualmente.
   *
   * Será útil para testes e administração.
   */
  async runManualCheck(): Promise<{
    success: boolean;
    message: string;
  }> {
    await this.checkFiscalDeadlines();

    return {
      success: true,

      message:
        'Verificação manual de alertas executada com sucesso.',
    };
  }

  /**
   * Define o tipo visual da notificação.
   */
  private getNotificationType(
    diffDays: number,
  ):
    | 'INFO'
    | 'WARNING'
    | 'ERROR' {
    if (diffDays >= 30) {
      return 'INFO';
    }

    if (diffDays >= 7) {
      return 'WARNING';
    }

    return 'ERROR';
  }

  /**
   * Título da notificação.
   */
  private buildTitle(
    diffDays: number,
  ): string {
    if (diffDays === 1) {
      return 'Prazo fiscal amanhã';
    }

    if (diffDays <= 3) {
      return 'Prazo fiscal urgente';
    }

    if (diffDays <= 7) {
      return 'Prazo fiscal próximo';
    }

    return 'Alerta Fiscal';
  }

  /**
   * Mensagem apresentada na plataforma.
   */
  private buildMessage(
    obligationTitle: string,
    diffDays: number,
  ): string {
    if (diffDays === 1) {
      return `${obligationTitle} vence amanhã. Consulte a obrigação e tome as medidas necessárias.`;
    }

    return `${obligationTitle} vence em ${diffDays} dias. Consulte a obrigação e prepare o cumprimento dentro do prazo.`;
  }

  /**
   * Corpo do e-mail.
   */
  private buildEmailBody(
    obligation: any,
    diffDays: number,
    dueDate: Date,
  ): string {
    const prazo =
      dueDate.toLocaleDateString(
        'pt-AO',
      );

    const saudacao =
      obligation.tenant?.name
        ? `Olá, ${obligation.tenant.name}.`
        : 'Olá.';

    let urgency =
      'Este é um aviso preventivo para ajudar a sua empresa a manter os prazos fiscais organizados.';

    if (diffDays <= 3) {
      urgency =
        'Este prazo está próximo. Recomendamos verificar a obrigação e tomar as medidas necessárias o quanto antes.';
    }

    if (diffDays === 1) {
      urgency =
        'Atenção: o prazo termina amanhã. Recomendamos verificar imediatamente a obrigação.';
    }

    return `${saudacao}

A Fiscalidade Digital identificou uma obrigação fiscal próxima do prazo.

OBRIGAÇÃO
${obligation.title}

PRAZO
${prazo}

TEMPO RESTANTE
${diffDays === 1
  ? '1 dia'
  : `${diffDays} dias`}

${urgency}

Aceda à Fiscalidade Digital para consultar os detalhes da obrigação.

Fiscalidade Digital
Gestão Fiscal Inteligente`;
  }

  /**
   * Normaliza uma data para o início do dia.
   */
  private startOfDay(
    date: Date,
  ): Date {
    const result =
      new Date(date);

    result.setHours(
      0,
      0,
      0,
      0,
    );

    return result;
  }
}