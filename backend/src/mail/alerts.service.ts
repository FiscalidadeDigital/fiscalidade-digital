import {
  Injectable,
  Logger,
} from '@nestjs/common';

import { Cron } from '@nestjs/schedule';

import { PrismaService } from '../prisma/prisma.service';
import { MailService } from './mail.service';
import { TwilioMessagingService } from './twilio-messaging.service';

@Injectable()
export class AlertsService {
  private readonly logger =
    new Logger(AlertsService.name);

  /**
   * Dias em que ser??o gerados alertas preventivos.
   *
   * 30 = um m??s antes
   * 15 = quinze dias antes
   * 7  = uma semana antes
   * 3  = tr??s dias antes
   * 1  = um dia antes
   * 0  = no pr??prio dia
   */
  private readonly alertDays = [
    30,
    15,
    7,
    3,
    1,
    0,
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly twilioMessagingService: TwilioMessagingService,
  ) {}

  /**
   * Executa automaticamente todos os dias
   * ??s 08:00 no hor??rio de Angola.
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
        `${obligations.length} obriga????o(??es) encontrada(s) para verifica????o.`,
      );

      for (const obligation of obligations) {
        await this.processObligation(
          obligation,
        );
      }

      this.logger.log(
        'Verifica????o de prazos fiscais conclu??da.',
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
   * Processa uma obriga????o individual.
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
       * Verifica se a obriga????o est?? atrasada.
       *
       * Quando passa do prazo:
       * - muda PENDING para LATE
       * - cria um alerta de atraso
       * - envia os canais configurados
       */
      if (diffDays < 0) {
        if (obligation.status === 'PENDING') {
          await this.prisma.fiscalObligation.update({
            where: {
              id: obligation.id,
            },

            data: {
              status: 'LATE',
            },
          });

          this.logger.warn(
            `Obriga????o atrasada: ${obligation.title}`,
          );
        }

        /*
         * Para obriga????es atrasadas usamos -1
         * como marcador ??nico.
         *
         * Assim n??o criamos um novo alerta todos
         * os dias para a mesma obriga????o.
         */
        await this.processAlert(
          obligation,
          -1,
          today,
          dueDate,
        );

        return;
      }

      /*
       * S?? criamos alertas nos marcos definidos.
       */
      if (
        !this.alertDays.includes(
          diffDays,
        )
      ) {
        return;
      }

      await this.processAlert(
        obligation,
        diffDays,
        today,
        dueDate,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao processar obriga????o ${obligation.title}.`,
        error instanceof Error
          ? error.stack
          : String(error),
      );
    }
  }

  /**
   * Processa um alerta fiscal.
   *
   * Este m??todo foi separado para permitir:
   * - cria????o da notifica????o
   * - e-mail
   * - SMS
   * - WhatsApp
   * - retry dos canais que falharam
   */
  private async processAlert(
    obligation: any,
    diffDays: number,
    today: Date,
    dueDate: Date,
  ): Promise<void> {
    /*
     * Verifica as configura????es da empresa.
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
     * Procura o alerta j?? existente.
     *
     * Diferente da implementa????o anterior,
     * n??o fazemos return simplesmente porque
     * o alerta existe.
     *
     * Se um canal falhou anteriormente,
     * o pr??ximo ciclo poder?? tentar novamente.
     */
    let fiscalAlert =
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

    /*
     * Se ainda n??o existe, criamos.
     */
    if (!fiscalAlert) {
      fiscalAlert =
        await this.prisma.fiscalAlert.create({
          data: {
            tenantId:
              obligation.tenantId,

            obligationId:
              obligation.id,

            daysBefore:
              diffDays,

            notificationSent:
              false,

            emailSent:
              false,

            emailStatus:
              null,

            smsSent:
              false,

            smsStatus:
              null,

            whatsappSent:
              false,

            whatsappStatus:
              null,

            notificationId:
              null,
          },
        });

      this.logger.log(
        `Novo alerta fiscal criado: ${obligation.title} - ${diffDays} dias.`,
      );
    } else {
      this.logger.log(
        `Alerta existente encontrado: ${obligation.title} - ${diffDays} dias. Verificando canais pendentes.`,
      );
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
     * =========================================================
     * 1. NOTIFICA????O INTERNA
     * =========================================================
     */
    if (!fiscalAlert.notificationSent) {
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

              isRead:
                false,

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
            notificationSent:
              true,

            notificationId:
              notification.id,
          },
        });

        fiscalAlert = {
          ...fiscalAlert,
          notificationSent: true,
          notificationId,
        };

        this.logger.log(
          `Notifica????o interna criada: ${obligation.title} - ${diffDays} dias.`,
        );
      } catch (error) {
        this.logger.error(
          `Erro ao criar notifica????o interna para ${obligation.title}.`,
          error instanceof Error
            ? error.stack
            : String(error),
        );
      }
    }

    /*
     * =========================================================
     * 2. E-MAIL
     * =========================================================
     */
    await this.processEmail(
      obligation,
      fiscalAlert,
      settings,
      diffDays,
      dueDate,
    );

    /*
     * =========================================================
     * 3. SMS
     * =========================================================
     */
    await this.processSms(
      obligation,
      fiscalAlert,
      settings,
      diffDays,
    );

    /*
     * =========================================================
     * 4. WHATSAPP
     * =========================================================
     */
    await this.processWhatsApp(
      obligation,
      fiscalAlert,
      settings,
      diffDays,
    );

    /*
     * Atualizamos os campos antigos
     * da obriga????o para manter compatibilidade
     * com o restante do sistema.
     */
    await this.prisma.fiscalObligation.update({
      where: {
        id: obligation.id,
      },

      data: {
        reminderSent:
          true,

        lastReminderAt:
          new Date(),
      },
    });

    this.logger.log(
      `Alerta fiscal processado: ${obligation.title} - ${this.getDaysDescription(diffDays)}.`,
    );
  }

  /**
   * Processa o envio de e-mail.
   */
  private async processEmail(
    obligation: any,
    fiscalAlert: any,
    settings: any,
    diffDays: number,
    dueDate: Date,
  ): Promise<void> {
    /*
     * Se j?? foi enviado, n??o enviamos novamente.
     */
    if (fiscalAlert.emailSent) {
      return;
    }

    const emailEnabled =
      settings?.emailEnabled !==
      false;

    const companyEmail =
      obligation.tenant?.email;

    if (!emailEnabled) {
      await this.prisma.fiscalAlert.update({
        where: {
          id: fiscalAlert.id,
        },

        data: {
          emailSent:
            false,

          emailStatus:
            'EMAIL_DISABLED',
        },
      });

      return;
    }

    if (!companyEmail) {
      await this.prisma.fiscalAlert.update({
        where: {
          id: fiscalAlert.id,
        },

        data: {
          emailSent:
            false,

          emailStatus:
            'NO_COMPANY_EMAIL',
        },
      });

      this.logger.warn(
        `Empresa ${obligation.tenant?.name} n??o possui e-mail cadastrado.`,
      );

      return;
    }

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
        companyEmail,
        subject,
        body,
      );

      await this.prisma.emailLog.create({
        data: {
          tenantId:
            obligation.tenantId,

          email:
            companyEmail,

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
          emailSent:
            true,

          emailStatus:
            'SENT',
        },
      });

      this.logger.log(
        `E-mail enviado: ${companyEmail} - ${obligation.title}.`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : String(error);

      /*
       * Guardamos o erro para permitir
       * nova tentativa no pr??ximo ciclo.
       */
      await this.prisma.emailLog.create({
        data: {
          tenantId:
            obligation.tenantId,

          email:
            companyEmail,

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
          emailSent:
            false,

          emailStatus:
            `FAILED: ${errorMessage}`,
        },
      });

      this.logger.error(
        `Falha ao enviar e-mail para ${companyEmail}.`,
        error instanceof Error
          ? error.stack
          : String(error),
      );
    }
  }

  /**
   * Processa o envio de SMS.
   */
  private async processSms(
    obligation: any,
    fiscalAlert: any,
    settings: any,
    diffDays: number,
  ): Promise<void> {
    /*
     * Se o SMS j?? foi enviado,
     * n??o enviamos novamente.
     */
    if (fiscalAlert.smsSent) {
      return;
    }

    const smsEnabled =
      settings?.smsEnabled !==
      false;

    const phone =
      obligation.tenant?.phone;

    if (!smsEnabled) {
      await this.prisma.fiscalAlert.update({
        where: {
          id: fiscalAlert.id,
        },

        data: {
          smsSent:
            false,

          smsStatus:
            'SMS_DISABLED',
        },
      });

      return;
    }

    if (!phone) {
      await this.prisma.fiscalAlert.update({
        where: {
          id: fiscalAlert.id,
        },

        data: {
          smsSent:
            false,

          smsStatus:
            'NO_COMPANY_PHONE',
        },
      });

      this.logger.warn(
        `Empresa ${obligation.tenant?.name} n??o possui telefone cadastrado para SMS.`,
      );

      return;
    }

    const smsMessage =
      this.buildSmsMessage(
        obligation.title,
        diffDays,
      );

    try {
      const result =
        await this.twilioMessagingService.sendSms(
          phone,
          smsMessage,
        );

      await this.prisma.sMSLog.create({
        data: {
          tenantId:
            obligation.tenantId,

          phone,

          message:
            smsMessage,

          status:
            'SENT',

          channel:
            'SMS',

          provider:
            'TWILIO',

          providerMessageId:
            result.providerMessageId,

          errorMessage:
            null,
        },
      });

      await this.prisma.fiscalAlert.update({
        where: {
          id: fiscalAlert.id,
        },

        data: {
          smsSent:
            true,

          smsStatus:
            'SENT',
        },
      });

      this.logger.log(
        `SMS enviado para ${phone}: ${obligation.title}.`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : String(error);

      /*
       * O erro fica registado.
       *
       * smsSent permanece false,
       * permitindo nova tentativa.
       */
      await this.prisma.sMSLog.create({
        data: {
          tenantId:
            obligation.tenantId,

          phone,

          message:
            smsMessage,

          status:
            'FAILED',

          channel:
            'SMS',

          provider:
            'TWILIO',

          providerMessageId:
            null,

          errorMessage,
        },
      });

      await this.prisma.fiscalAlert.update({
        where: {
          id: fiscalAlert.id,
        },

        data: {
          smsSent:
            false,

          smsStatus:
            `FAILED: ${errorMessage}`,
        },
      });

      this.logger.error(
        `Falha ao enviar SMS para ${phone}.`,
        error instanceof Error
          ? error.stack
          : String(error),
      );
    }
  }

  /**
   * Processa o envio de WhatsApp.
   *
   * O WhatsApp s?? ser?? enviado quando:
   * - estiver ativado nas configura????es;
   * - existir telefone;
   * - existir whatsappOptInAt.
   */
  private async processWhatsApp(
    obligation: any,
    fiscalAlert: any,
    settings: any,
    diffDays: number,
  ): Promise<void> {
    /*
     * Se j?? foi enviado,
     * n??o enviamos novamente.
     */
    if (fiscalAlert.whatsappSent) {
      return;
    }

    const whatsappEnabled =
      settings?.whatsappEnabled ===
      true;

    const whatsappOptIn =
      !!settings?.whatsappOptInAt;

    const phone =
      obligation.tenant?.phone;

    if (!whatsappEnabled) {
      await this.prisma.fiscalAlert.update({
        where: {
          id: fiscalAlert.id,
        },

        data: {
          whatsappSent:
            false,

          whatsappStatus:
            'WHATSAPP_DISABLED',
        },
      });

      return;
    }

    if (!whatsappOptIn) {
      await this.prisma.fiscalAlert.update({
        where: {
          id: fiscalAlert.id,
        },

        data: {
          whatsappSent:
            false,

          whatsappStatus:
            'WHATSAPP_NO_OPT_IN',
        },
      });

      this.logger.log(
        `WhatsApp n??o enviado para ${obligation.tenant?.name}: opt-in n??o confirmado.`,
      );

      return;
    }

    if (!phone) {
      await this.prisma.fiscalAlert.update({
        where: {
          id: fiscalAlert.id,
        },

        data: {
          whatsappSent:
            false,

          whatsappStatus:
            'NO_COMPANY_PHONE',
        },
      });

      this.logger.warn(
        `Empresa ${obligation.tenant?.name} n??o possui telefone para WhatsApp.`,
      );

      return;
    }

    /*
     * Vari??veis enviadas para o template
     * aprovado no Twilio/WhatsApp.
     */
    const variables =
      this.buildWhatsAppVariables(
        obligation,
        diffDays,
      );

    try {
      const result =
        await this.twilioMessagingService.sendWhatsApp(
          phone,
          variables,
        );

      await this.prisma.sMSLog.create({
        data: {
          tenantId:
            obligation.tenantId,

          phone,

          message:
            this.buildWhatsAppLogMessage(
              obligation.title,
              diffDays,
            ),

          status:
            'SENT',

          channel:
            'WHATSAPP',

          provider:
            'TWILIO',

          providerMessageId:
            result.providerMessageId,

          errorMessage:
            null,
        },
      });

      await this.prisma.fiscalAlert.update({
        where: {
          id: fiscalAlert.id,
        },

        data: {
          whatsappSent:
            true,

          whatsappStatus:
            'SENT',
        },
      });

      this.logger.log(
        `WhatsApp enviado para ${phone}: ${obligation.title}.`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : String(error);

      await this.prisma.sMSLog.create({
        data: {
          tenantId:
            obligation.tenantId,

          phone,

          message:
            this.buildWhatsAppLogMessage(
              obligation.title,
              diffDays,
            ),

          status:
            'FAILED',

          channel:
            'WHATSAPP',

          provider:
            'TWILIO',

          providerMessageId:
            null,

          errorMessage,
        },
      });

      await this.prisma.fiscalAlert.update({
        where: {
          id: fiscalAlert.id,
        },

        data: {
          whatsappSent:
            false,

          whatsappStatus:
            `FAILED: ${errorMessage}`,
        },
      });

      this.logger.error(
        `Falha ao enviar WhatsApp para ${phone}.`,
        error instanceof Error
          ? error.stack
          : String(error),
      );
    }
  }

  /**
   * Permite executar a verifica????o manualmente.
   *
   * Ser?? ??til para testes e administra????o.
   */
  async runManualCheck(): Promise<{
    success: boolean;
    message: string;
  }> {
    await this.checkFiscalDeadlines();

    return {
      success: true,

      message:
        'Verifica????o manual de alertas executada com sucesso.',
    };
  }

  /**
   * Define o tipo visual da notifica????o.
   */
  private getNotificationType(
    diffDays: number,
  ):
    | 'INFO'
    | 'WARNING'
    | 'ERROR' {
    if (diffDays >= 15) {
      return 'INFO';
    }

    if (diffDays >= 7) {
      return 'WARNING';
    }

    return 'ERROR';
  }

  /**
   * T??tulo da notifica????o.
   */
  private buildTitle(
    diffDays: number,
  ): string {
    if (diffDays < 0) {
      return 'Obriga????o fiscal em atraso';
    }

    if (diffDays === 0) {
      return 'Prazo fiscal termina hoje';
    }

    if (diffDays === 1) {
      return 'Prazo fiscal amanh??';
    }

    if (diffDays <= 3) {
      return 'Prazo fiscal urgente';
    }

    if (diffDays <= 7) {
      return 'Prazo fiscal pr??ximo';
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
    if (diffDays < 0) {
      return `${obligationTitle} encontra-se em atraso. Verifique a obriga????o e regularize a situa????o o quanto antes.`;
    }

    if (diffDays === 0) {
      return `${obligationTitle} vence hoje. Verifique a obriga????o e tome as medidas necess??rias.`;
    }

    if (diffDays === 1) {
      return `${obligationTitle} vence amanh??. Consulte a obriga????o e tome as medidas necess??rias.`;
    }

    return `${obligationTitle} vence em ${diffDays} dias. Consulte a obriga????o e prepare o cumprimento dentro do prazo.`;
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
        ? `Ol??, ${obligation.tenant.name}.`
        : 'Ol??.';

    let urgency =
      'Este ?? um aviso preventivo para ajudar a sua empresa a manter os prazos fiscais organizados.';

    if (diffDays < 0) {
      urgency =
        'Aten????o: esta obriga????o encontra-se em atraso. Verifique a situa????o e tome as medidas necess??rias para regulariza????o.';
    }

    if (diffDays === 0) {
      urgency =
        'Aten????o: o prazo termina hoje. Recomendamos verificar imediatamente a obriga????o.';
    }

    if (diffDays > 0 && diffDays <= 3) {
      urgency =
        'Este prazo est?? pr??ximo. Recomendamos verificar a obriga????o e tomar as medidas necess??rias o quanto antes.';
    }

    if (diffDays === 1) {
      urgency =
        'Aten????o: o prazo termina amanh??. Recomendamos verificar imediatamente a obriga????o.';
    }

    const tempoRestante =
      diffDays < 0
        ? `Em atraso h?? ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'dia' : 'dias'}`
        : diffDays === 0
          ? 'Vence hoje'
          : diffDays === 1
            ? '1 dia'
            : `${diffDays} dias`;

    return `${saudacao}

A Fiscalidade Digital identificou uma obriga????o fiscal que requer a sua aten????o.

OBRIGA????O
${obligation.title}

PRAZO
${prazo}

TEMPO RESTANTE
${tempoRestante}

${urgency}

Aceda ?? Fiscalidade Digital para consultar os detalhes da obriga????o.

Fiscalidade Digital
Gest??o Fiscal Inteligente`;
  }

  /**
   * Mensagem curta para SMS.
   */
  private buildSmsMessage(
    obligationTitle: string,
    diffDays: number,
  ): string {
    if (diffDays < 0) {
      return `Fiscalidade Digital: ${obligationTitle} est?? em atraso. Consulte o sistema para verificar e regularizar a obriga????o.`;
    }

    if (diffDays === 0) {
      return `Fiscalidade Digital: ${obligationTitle} vence hoje. Consulte o sistema e tome as medidas necess??rias.`;
    }

    if (diffDays === 1) {
      return `Fiscalidade Digital: ${obligationTitle} vence amanh??. Consulte o sistema para verificar a obriga????o.`;
    }

    return `Fiscalidade Digital: ${obligationTitle} vence em ${diffDays} dias. Consulte o sistema para mais detalhes.`;
  }

  /**
   * Vari??veis do template WhatsApp.
   *
   * Estas vari??veis ser??o utilizadas pelo
   * Content Template configurado no Twilio.
   *
   * {{1}} = empresa
   * {{2}} = obriga????o
   * {{3}} = prazo
   * {{4}} = tempo restante
   */
  private buildWhatsAppVariables(
    obligation: any,
    diffDays: number,
  ): Record<string, string> {
    const dueDate =
      new Date(
        obligation.dueDate,
      );

    const prazo =
      this.startOfDay(
        dueDate,
      ).toLocaleDateString(
        'pt-AO',
      );

    const tempoRestante =
      diffDays < 0
        ? `Em atraso h?? ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'dia' : 'dias'}`
        : diffDays === 0
          ? 'Vence hoje'
          : diffDays === 1
            ? '1 dia'
            : `${diffDays} dias`;

    return {
      '1':
        obligation.tenant?.name ||
        'Empresa',

      '2':
        obligation.title,

      '3':
        prazo,

      '4':
        tempoRestante,
    };
  }

  /**
   * Texto guardado no log para WhatsApp.
   */
  private buildWhatsAppLogMessage(
    obligationTitle: string,
    diffDays: number,
  ): string {
    if (diffDays < 0) {
      return `WhatsApp fiscal: ${obligationTitle} em atraso.`;
    }

    if (diffDays === 0) {
      return `WhatsApp fiscal: ${obligationTitle} vence hoje.`;
    }

    if (diffDays === 1) {
      return `WhatsApp fiscal: ${obligationTitle} vence amanh??.`;
    }

    return `WhatsApp fiscal: ${obligationTitle} vence em ${diffDays} dias.`;
  }

  /**
   * Descri????o amig??vel dos dias.
   */
  private getDaysDescription(
    diffDays: number,
  ): string {
    if (diffDays < 0) {
      return `atraso de ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'dia' : 'dias'}`;
    }

    if (diffDays === 0) {
      return 'vence hoje';
    }

    if (diffDays === 1) {
      return 'vence amanh??';
    }

    return `vence em ${diffDays} dias`;
  }

  /**
   * Normaliza uma data para o in??cio do dia.
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
