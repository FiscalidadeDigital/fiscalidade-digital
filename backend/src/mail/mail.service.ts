import {
  Injectable,
  Logger,
} from '@nestjs/common';

import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger =
    new Logger(MailService.name);

  private transporter =
    nodemailer.createTransport({
      service: 'gmail',

      auth: {
        user:
          process.env.EMAIL_USER,

        pass:
          process.env.EMAIL_PASS,
      },
    });

  async sendMail(
    to: string,
    subject: string,
    text: string,
  ) {
    if (!to) {
      throw new Error(
        'E-mail do destinatário não informado.',
      );
    }

    return this.transporter.sendMail({
      from:
        process.env.EMAIL_USER,

      to,

      subject,

      text,
    });
  }

  async sendEmailVerification(to: string, name: string, code: string) {
    return this.sendMail(
      to,
      'Confirme o seu email — Fiscalidade Digital',
      `Olá ${name},\n\nUse o código ${code} para confirmar o seu email. O código expira em 10 minutos.\n\nSe não iniciou este registo, ignore esta mensagem.`,
    );
  }

  async sendPasswordRecovery(to: string, name: string, code: string) {
    return this.sendMail(
      to,
      'Recuperação de palavra-passe — Fiscalidade Digital',
      `Olá ${name},\n\nUse o código ${code} para redefinir a sua palavra-passe. O código expira em 10 minutos.\n\nSe não pediu esta alteração, ignore esta mensagem.`,
    );
  }

  async sendPasswordChanged(to: string, name: string) {
    return this.sendMail(
      to,
      'Palavra-passe alterada — Fiscalidade Digital',
      `Olá ${name},\n\nA palavra-passe da sua conta foi alterada. Se não reconhece esta ação, contacte o suporte imediatamente.`,
    );
  }

  async sendUserInvitation(to: string, inviterName: string, token: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const url = `${frontendUrl}/first-access?token=${encodeURIComponent(token)}`;
    return this.sendMail(
      to,
      'Convite — Fiscalidade Digital',
      `${inviterName} convidou-o para a Fiscalidade Digital.\n\nDefina a sua palavra-passe em: ${url}\n\nO convite expira em 48 horas.`,
    );
  }
}
