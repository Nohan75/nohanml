import {
  Injectable,
  Logger,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { SendContactDto } from './dto/send-contact.dto';
import { Profile } from '../profile/profile.entity';

@Injectable()
export class ContactService implements OnModuleInit {
  private readonly logger = new Logger(ContactService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,
  ) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: this.config.get<string>('MAIL_USER'),
        pass: this.config.get<string>('MAIL_PASS'),
      },
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified ✓');
    } catch (err: unknown) {
      const e = err as { code?: string; response?: string };
      this.logger.error(
        `SMTP verification failed — code: ${e.code ?? '?'} | ${e.response ?? err}`,
      );
    }
  }

  async send(dto: SendContactDto): Promise<void> {
    const mailFrom = this.config.get<string>('MAIL_USER');

    const profiles = await this.profileRepo.find({ take: 1 });
    const mailTo = profiles[0]?.email ?? this.config.get<string>('MAIL_TO');

    if (!mailTo) {
      throw new InternalServerErrorException('Adresse de destination introuvable');
    }

    try {
      await this.transporter.sendMail({
        from:    mailFrom,
        to:      mailTo,
        replyTo: dto.email,
        subject: `Message de ${dto.name} — Portfolio`,
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

      this.logger.log(`Email envoyé de ${dto.email} vers ${mailTo}`);
    } catch (err: unknown) {
      const e = err as { code?: string; response?: string; responseCode?: number };
      this.logger.error(
        `Échec envoi email — code: ${e.code ?? '?'} | SMTP: ${e.responseCode ?? ''} ${e.response ?? err}`,
      );
      throw new InternalServerErrorException("Erreur lors de l'envoi du message");
    }
  }
}
