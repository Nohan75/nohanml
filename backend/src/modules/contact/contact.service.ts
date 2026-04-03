import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { SendContactDto } from './dto/send-contact.dto';
import { Profile } from '../profile/profile.entity';

@Injectable()
export class ContactService {
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

  async send(dto: SendContactDto): Promise<void> {
    const mailFrom = this.config.get<string>('MAIL_USER');

    // Récupère l'email de destination depuis le profil en base
    const profiles = await this.profileRepo.find({ take: 1 });
    const mailTo = profiles[0]?.email ?? this.config.get<string>('MAIL_TO');

    if (!mailTo) {
      throw new InternalServerErrorException('Adresse de destination introuvable');
    }

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

      this.logger.log(`Contact email sent from ${dto.email} to ${mailTo}`);
    } catch (err) {
      this.logger.error('Failed to send contact email', err);
      throw new InternalServerErrorException("Erreur lors de l'envoi du message");
    }
  }
}
