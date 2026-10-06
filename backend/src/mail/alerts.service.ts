import {
  BadRequestException,
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';

import { Cron } from '@nestjs/schedule';

import { PrismaService } from '../prisma/prisma.service';
import { MailService } from './mail.service';
import { TwilioMessagingService } from './twilio-messaging.service';
import { FiscalWatchService } from '../fiscal-watch/fiscal-watch.service';

type AlertCheckMetrics = {
  scanned: number;
  alertsTriggered: number;
  alertsCreated: number;
  alertsReused: number;
  notificationsCreated: number;
  emailsSent: number;
  emailsSkipped: number;
  emailsFailed: number;
  smsSent: number;
  whatsappSent: number;
  skipReasons: Record<string, number>;
};

function emptyAlertCheckMetrics(): AlertCheckMetrics {
  return {
    scanned: 0,
    alertsTriggered: 0,
    alertsCreated: 0,
    alertsReused: 0,
    notificationsCreated: 0,
    emailsSent: 0,
    emailsSkipped: 0,
    emailsFailed: 0,
    smsSent: 0,
    whatsappSent: 0,
    skipReasons: {},
  };
}

function recordSkip(metrics: AlertCheckMetrics, reason: string) {
  metrics.skipReasons[reason] = (metrics.skipReasons[reason] || 0) + 1;
}

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
    @Optional() private readonly fiscalWatchService?: FiscalWatchService,
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
      const obligations = await this.findEligibleObligations();
      const metrics = emptyAlertCheckMetrics();
      metrics.scanned = obligations.length;

      this.logger.log(
        'Obrigações elegíveis carregadas para verificação.',
      );

      for (const obligation of obligations) {
        await this.processObligation(
          obligation,
          metrics,
        );
      }

      this.logger.log(
        'Verifica????o de prazos fiscais conclu??da.',
      );
    } catch (error) {
      this.logger.error(
        'Falha ao verificar prazos fiscais.',
      );
    }
  }

  /**
   * Processa uma obriga????o individual.
   */
  private async processObligation(obligation: any, metrics: AlertCheckMetrics): Promise<void> {
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
            'Uma obrigação fiscal passou da data de vencimento.',
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
          metrics,
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
        recordSkip(metrics, 'OUTSIDE_WINDOW');
        return;
      }

      if (this.fiscalWatchService) {
        await this.fiscalWatchService.evaluateAllTenants();
      }

      await this.processAlert(
        obligation,
        diffDays,
        today,
        dueDate,
        metrics,
      );
    } catch (error) {
      this.logger.error(
        'Falha ao processar uma obrigação fiscal.',
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
    metrics: AlertCheckMetrics,
  ): Promise<void> {
    metrics.alertsTriggered += 1;
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
      if (settings?.fiscalAlertsEnabled === false) recordSkip(metrics, 'FISCAL_ALERTS_DISABLED');
      if (settings?.fiscalReminderEnabled === false) recordSkip(metrics, 'FISCAL_REMINDER_DISABLED');
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

      metrics.alertsCreated += 1;

      this.logger.log(
        'Novo alerta fiscal criado.',
      );
    } else {
      metrics.alertsReused += 1;
      this.logger.log(
        'Alerta fiscal existente verificado.',
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

        metrics.notificationsCreated += 1;

        this.logger.log(
          'Notificação fiscal interna criada.',
        );
      } catch (error) {
        this.logger.error(
          'Falha ao criar notificação fiscal interna.',
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
      metrics,
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
      metrics,
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
      metrics,
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
      'Alerta fiscal processado.',
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
    metrics: AlertCheckMetrics,
  ): Promise<void> {
    /*
     * Se j?? foi enviado, n??o enviamos novamente.
     */
    if (fiscalAlert.emailSent) {
      metrics.emailsSkipped += 1;
      recordSkip(metrics, 'ALREADY_SENT');
      return;
    }

    const emailEnabled =
      settings?.emailEnabled !==
      false;

    const companyEmail =
      obligation.tenant?.email;

    if (!emailEnabled) {
      metrics.emailsSkipped += 1;
      recordSkip(metrics, 'EMAIL_DISABLED');
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
      metrics.emailsSkipped += 1;
      recordSkip(metrics, 'MISSING_RECIPIENT');
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
        'A empresa não possui endereço de e-mail configurado para alertas.',
      );

      return;
    }

    try {
      await this.mailService.sendObligationAlert(
        companyEmail,
        obligation.tenant.name,
        obligation.title,
        obligation.period || 'Período não especificado',
        dueDate.toLocaleDateString('pt-AO'),
        diffDays < 0 ? 'Vencida' : 'A vencer',
        `${process.env.APP_URL || process.env.FRONTEND_URL || 'https://fiscalidadedigital.ao'}/obligations`,
      );

      await this.prisma.emailLog.create({
        data: {
          tenantId:
            obligation.tenantId,

          email:
            this.maskEmail(companyEmail),

          subject: 'Alerta fiscal',

          body: null,

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

      metrics.emailsSent += 1;

      this.logger.log(
        'E-mail de alerta enviado.',
      );
    } catch {
      metrics.emailsFailed += 1;
      recordSkip(metrics, 'PROVIDER_FAILED');
      const errorMessage = 'Falha de entrega do fornecedor.';

      /*
       * Guardamos o erro para permitir
       * nova tentativa no pr??ximo ciclo.
       */
      await this.prisma.emailLog.create({
        data: {
          tenantId:
            obligation.tenantId,

          email:
            this.maskEmail(companyEmail),

          subject: 'Alerta fiscal',

          body: null,

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
        'Falha ao enviar e-mail de alerta.',
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
    metrics: AlertCheckMetrics,
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
        'SMS não enviado porque não existe telefone configurado.',
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

          phone: this.maskPhone(phone),

          message: 'Alerta fiscal',

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

      metrics.smsSent += 1;

      this.logger.log(
        'SMS de alerta enviado.',
      );
    } catch {
      const errorMessage =
        'Falha de entrega do fornecedor.';

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

          phone: this.maskPhone(phone),

          message: 'Alerta fiscal',

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
        'Falha ao enviar SMS de alerta.',
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
    metrics: AlertCheckMetrics,
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
        'WhatsApp não enviado porque falta consentimento registado.',
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
        'WhatsApp não enviado porque não existe telefone configurado.',
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

          phone: this.maskPhone(phone),

          message: 'Alerta fiscal',

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

      metrics.whatsappSent += 1;

      this.logger.log(
        'Mensagem WhatsApp de alerta enviada.',
      );
    } catch {
      const errorMessage =
        'Falha de entrega do fornecedor.';

      await this.prisma.sMSLog.create({
        data: {
          tenantId:
            obligation.tenantId,

          phone: this.maskPhone(phone),

          message: 'Alerta fiscal',

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
        'Falha ao enviar mensagem WhatsApp de alerta.',
      );
    }
  }

  /**
   * Permite executar a verifica????o manualmente.
   *
   * Ser?? ??til para testes e administra????o.
   */
  async runManualCheck(tenantId: string): Promise<{
    success: boolean;
    message: string;
    processed: number;
  } & AlertCheckMetrics> {
    if (!tenantId) {
      throw new BadRequestException('Empresa autenticada não identificada.');
    }

    const obligations = await this.findEligibleObligations(tenantId);
    const metrics = emptyAlertCheckMetrics();
    metrics.scanned = obligations.length;

    for (const obligation of obligations) {
      await this.processObligation(obligation, metrics);
    }

    return {
      success: true,
      message:
        'Verifica????o manual de alertas executada com sucesso.',
      processed: obligations.length,
      ...metrics,
    };
  }

  private findEligibleObligations(tenantId?: string) {
    return this.prisma.fiscalObligation.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        alertEnabled: true,
        status: { not: 'PAID' },
      },
      include: {
        tenant: {
          include: {
            companySettings: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
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

  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) {
      return '***';
    }
    return `${localPart.slice(0, 1)}***@${domain}`;
  }

  private maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    return digits.length > 2 ? `***${digits.slice(-2)}` : '***';
  }
}
