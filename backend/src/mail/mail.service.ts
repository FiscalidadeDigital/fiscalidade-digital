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
}