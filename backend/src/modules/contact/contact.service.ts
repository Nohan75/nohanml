import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SendContactDto } from './dto/send-contact.dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('MAIL_HOST'),
      port: this.config.get<number>('MAIL_PORT'),
      secure: false,
      auth: {
        user: this.config.get<string>('MAIL_USER'),
        pass: this.config.get<string>('MAIL_PASS'),
      },
    });
  }

  async send(dto: SendContactDto): Promise<void> {
    const mailTo = this.config.get<string>('MAIL_TO');
    const mailFrom = this.config.get<string>('MAIL_FROM');

    await this.transporter.sendMail({
      from: mailFrom,
      to: mailTo,
      subject: `[Portfolio] Message de ${dto.name}`,
      text: `De : ${dto.name} <${dto.email}>\n\n${dto.message}`,
      html: `
        <p><strong>De :</strong> ${dto.name} &lt;${dto.email}&gt;</p>
        <p><strong>Message :</strong></p>
        <p>${dto.message.replace(/\n/g, '<br>')}</p>
      `,
    });

    this.logger.log(`Contact email sent from ${dto.email}`);
  }
}
