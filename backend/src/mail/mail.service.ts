import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

import { invitationEmail, obligationEmail, passwordRecoveryEmail, plainText, renderEmailHtml, verificationEmail } from './email-templates';

type SendMailOptions = { html?: string; text?: string };

@Injectable()
export class MailService {
  private readonly logger =
    new Logger(MailService.name);

  private readonly resendApiUrl = 'https://api.resend.com/emails';

  private get from() {
    return process.env.RESEND_FROM || 'Fiscalidade Digital <noreply@fiscalidadedigital.ao>';
  }

  private get appUrl() {
    return (process.env.APP_URL || process.env.FRONTEND_URL || 'https://fiscalidadedigital.ao').replace(/\/$/, '');
  }

  async sendMail(
    to: string,
    subject: string,
    text: string,
    options: SendMailOptions = {},
  ) {
    if (!to) {
      throw new ServiceUnavailableException('Não foi possível enviar o email neste momento.');
    }
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new ServiceUnavailableException('O serviço de email não está configurado.');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(this.resendApiUrl, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: this.from, to: [to], subject, text, html: options.html || renderEmailHtml(subject, `<p>${text.replace(/\n/g, '<br>')}</p>`) }), signal: controller.signal });
      if (!response.ok) {
        this.logger.error(`Resend falhou ao enviar email (${response.status}).`);
        throw new ServiceUnavailableException('Não foi possível enviar o email neste momento.');
      }
      return response.json();
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      this.logger.error('Resend indisponível ao enviar email.');
      throw new ServiceUnavailableException('Não foi possível enviar o email neste momento.');
    } finally {
      clearTimeout(timeout);
    }
  }

  async sendEmailVerification(to: string, name: string, code: string) {
    return this.sendMail(to, 'Confirme o seu email — Fiscalidade Digital', plainText([`Olá ${name}.`, `Use o código ${code} para confirmar o seu email. Este código é válido por 10 minutos.`, 'Se não iniciou este registo, ignore esta mensagem.']), { html: verificationEmail(name, code) });
  }

  async sendPasswordRecovery(to: string, name: string, code: string) {
    return this.sendMail(to, 'Recuperação de palavra-passe — Fiscalidade Digital', plainText([`Olá ${name}.`, `Use o código ${code} para redefinir a sua palavra-passe. Este código é válido por 10 minutos.`, 'Se não pediu esta alteração, ignore esta mensagem.']), { html: passwordRecoveryEmail(name, code) });
  }

  async sendPasswordChanged(to: string, name: string) {
    return this.sendMail(to, 'Palavra-passe alterada — Fiscalidade Digital', `Olá ${name}.\n\nA palavra-passe da sua conta foi alterada. Se não reconhece esta acção, contacte o suporte imediatamente.`);
  }

  async sendUserInvitation(to: string, inviterName: string, token: string, company = 'a sua empresa', role = 'membro da equipa') {
    const url = `${this.appUrl}/first-access?token=${encodeURIComponent(token)}`;
    return this.sendMail(to, `Foi convidado para ${company} — Fiscalidade Digital`, plainText([`${inviterName} convidou-o para ${company}.`, `Função atribuída: ${role}.`, `Aceite o convite em: ${url}`, 'O convite expira em 48 horas.']), { html: invitationEmail(company, role, inviterName, url) });
  }

  async sendObligationAlert(to: string, company: string, title: string, period: string, dueDate: string, status: string, url?: string) {
    return this.sendMail(to, `Obrigação fiscal — ${title}`, plainText([`Empresa: ${company}`, `Obrigação: ${title}`, `Período: ${period}`, `Vencimento: ${dueDate}`, `Estado: ${status}`, ...(url ? [`Consultar: ${url}`] : [])]), { html: obligationEmail(company, title, period, dueDate, status, url) });
  }
}
