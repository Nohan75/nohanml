import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('profile')
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  // Page d'accueil
  @Column({ type: 'varchar', length: 150 })
  heroTitle: string;

  @Column({ type: 'text' })
  heroSubtitle: string;

  // Page À propos
  @Column({ type: 'text' })
  bio: string;

  // Infos de contact / profil
  @Column({ type: 'varchar', length: 150 })
  email: string;

  @Column({ type: 'varchar', length: 150 })
  location: string;

  @Column({ type: 'boolean', default: true })
  available: boolean;

  @Column({ type: 'varchar', nullable: true })
  cvUrl: string | null;

  // Réseaux sociaux
  @Column({ type: 'varchar', nullable: true })
  linkedinUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  githubUrl: string | null;
}
