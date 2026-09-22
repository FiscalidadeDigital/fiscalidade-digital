import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TwilioMessagingService {
  private readonly logger = new Logger(TwilioMessagingService.name);

  private normalizePhone(phone: string): string {
    const value = String(phone || '').trim().replace(/\s+/g, '');

    if (value.startsWith('+244')) return value;
    if (value.startsWith('244')) return `+${value}`;
    if (value.startsWith('0')) return `+244${value.substring(1)}`;
    if (/^9\d{8}$/.test(value)) return `+244${value}`;

    return value;
  }

  private getAuthHeader(): string {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;

    if (!sid || !token) {
      throw new Error('Twilio n?o configurado: TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN ausentes.');
    }

    return `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`;
  }

  async sendSms(phone: string, message: string) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const from = process.env.TWILIO_SMS_FROM;

    if (!sid || !from) {
      throw new Error('Twilio SMS n?o configurado: TWILIO_ACCOUNT_SID/TWILIO_SMS_FROM ausentes.');
    }

    const to = this.normalizePhone(phone);

    const body = new URLSearchParams({
      To: to,
      From: from,
      Body: message,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: this.getAuthHeader(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      this.logger.error(`Erro Twilio SMS: ${JSON.stringify(data)}`);
      throw new Error(data?.message || 'Falha ao enviar SMS pelo Twilio.');
    }

    this.logger.log(`SMS enviado para ${to}. SID: ${data.sid}`);

    return {
      success: true,
      providerMessageId: data.sid,
      status: data.status,
    };
  }

  async sendWhatsApp(
    phone: string,
    variables: Record<string, string>,
  ) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const contentSid = process.env.TWILIO_WHATSAPP_CONTENT_SID;
    const from = process.env.TWILIO_WHATSAPP_FROM;

    if (!sid || !from || !contentSid) {
      throw new Error(
        'Twilio WhatsApp n?o configurado: TWILIO_ACCOUNT_SID/TWILIO_WHATSAPP_FROM/TWILIO_WHATSAPP_CONTENT_SID ausentes.',
      );
    }

    const to = `whatsapp:${this.normalizePhone(phone)}`;

    const body = new URLSearchParams({
      To: to,
      From: from.startsWith('whatsapp:')
        ? from
        : `whatsapp:${this.normalizePhone(from)}`,
      ContentSid: contentSid,
      ContentVariables: JSON.stringify(variables),
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: this.getAuthHeader(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      this.logger.error(`Erro Twilio WhatsApp: ${JSON.stringify(data)}`);
      throw new Error(data?.message || 'Falha ao enviar WhatsApp pelo Twilio.');
    }

    this.logger.log(`WhatsApp enviado para ${to}. SID: ${data.sid}`);

    return {
      success: true,
      providerMessageId: data.sid,
      status: data.status,
    };
  }
}
