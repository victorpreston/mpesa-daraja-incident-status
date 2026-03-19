import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailChannel {
  private readonly logger = new Logger(EmailChannel.name);

  constructor(private readonly config: ConfigService) {}

  async send(to: string, subject: string, html: string): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST'),
      port: this.config.get<number>('SMTP_PORT') ?? 587,
      secure: false,
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASSWORD'),
      },
    });

    await transporter.sendMail({
      from: this.config.get<string>('EMAIL_FROM'),
      to,
      subject,
      html,
    });

    this.logger.log(`Email sent to ${to}`);
  }
}
