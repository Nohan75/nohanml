import {
  Injectable,
  Logger,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resend } from 'resend';
import { SendContactDto } from './dto/send-contact.dto';
import { Profile } from '../profile/profile.entity';

@Injectable()
export class ContactService implements OnModuleInit {
  private readonly logger = new Logger(ContactService.name);
  private resend: Resend;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,
  ) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
  }

  async onModuleInit(): Promise<void> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY non définie — les emails ne seront pas envoyés');
    } else {
      this.logger.log('Resend initialisé ✓');
    }
  }

  async send(dto: SendContactDto): Promise<void> {
    const mailFrom = this.config.get<string>('MAIL_FROM') ?? 'contact@nohanml.com';

    const profiles = await this.profileRepo.find({ take: 1 });
    const mailTo = profiles[0]?.email ?? this.config.get<string>('MAIL_TO');

    if (!mailTo) {
      throw new InternalServerErrorException('Adresse de destination introuvable');
    }

    const { error } = await this.resend.emails.send({
      from:     `Portfolio <${mailFrom}>`,
      to:       [mailTo],
      replyTo:  dto.email,
      subject:  `Message de ${dto.name} — Portfolio`,
      text:     `De : ${dto.name} <${dto.email}>\n\n${dto.message}`,
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

    if (error) {
      this.logger.error(`Échec envoi email — ${JSON.stringify(error)}`);
      throw new InternalServerErrorException("Erreur lors de l'envoi du message");
    }

    this.logger.log(`Email envoyé de ${dto.email} vers ${mailTo}`);
  }
}
