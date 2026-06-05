import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AlertsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  @Cron('0 8 * * *')
  async checkFiscalDeadlines() {
    const obligations =
      await this.prisma.fiscalObligation.findMany({
        include: {
          tenant: true,
        },
      });

    const today = new Date();

    for (const obligation of obligations) {
      const dueDate = new Date(obligation.dueDate);

      const diffDays = Math.ceil(
        (dueDate.getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (
        [30, 15, 7, 3, 1].includes(diffDays)
      ) {
        await this.mailService.sendMail(
          obligation.tenant.email,
          `Alerta Fiscal - ${obligation.title}`,
          `A obrigação fiscal "${obligation.title}" vence em ${diffDays} dia(s).`,
        );

        await this.prisma.notification.create({
          data: {
            tenantId: obligation.tenantId,
            title: 'Alerta Fiscal',
            message: `${obligation.title} vence em ${diffDays} dia(s).`,
            isRead: false,
          },
        });

        console.log(
          `Alerta enviado para ${obligation.title}`,
        );
      }
    }
  }
}