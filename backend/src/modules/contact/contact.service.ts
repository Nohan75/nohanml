import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SendContactDto } from './dto/send-contact.dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.config.get<string>('MAIL_USER'),
        pass: this.config.get<string>('MAIL_PASS'),
      },
    });
  }

  async send(dto: SendContactDto): Promise<void> {
    const mailTo   = this.config.get<string>('MAIL_TO');
    const mailFrom = this.config.get<string>('MAIL_FROM');

    try {
      await this.transporter.sendMail({
        from:    `"Portfolio" <${mailFrom}>`,
        to:      mailTo,
        replyTo: dto.email,
        subject: `[Portfolio] Message de ${dto.name}`,
        text:    `De : ${dto.name} <${dto.email}>\n\n${dto.message}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:auto">
            <h2 style="color:#6366f1">Nouveau message — Portfolio</h2>
            <p><strong>Nom :</strong> ${dto.name}</p>
            <p><strong>Email :</strong> <a href="mailto:${dto.email}">${dto.email}</a></p>
            <hr style="border:1px solid #27272a"/>
            <p style="white-space:pre-line">${dto.message}</p>
          </div>
        `,
      });

      this.logger.log(`Contact email sent from ${dto.email}`);
    } catch (err) {
      this.logger.error('Failed to send contact email', err);
      throw new InternalServerErrorException("Erreur lors de l'envoi du message");
    }
  }
}
