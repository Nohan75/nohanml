import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeepPartial, ObjectLiteral, Repository } from 'typeorm';
import { Experience } from '../modules/experiences/experience.entity';
import { Profile } from '../modules/profile/profile.entity';
import { Project } from '../modules/projects/project.entity';
import { Skill } from '../modules/skills/skill.entity';
import { SeedModule } from './seed.module';

export const SAMPLE_PROFILE: DeepPartial<Profile> = {
  heroTitle: 'Développeur web full-stack',
  heroSubtitle: 'Je conçois et développe des applications web modernes.',
  bio: "Développeur passionné par le web, j'aime construire des produits simples, fiables et agréables à utiliser.",
  email: 'delivered@resend.dev',
  location: 'Paris, France',
  available: true,
  cvUrl: null,
  linkedinUrl: null,
  githubUrl: null,
};

export const SAMPLE_PROJECT: DeepPartial<Project> = {
  title: 'Projet exemple',
  description:
    "Un projet d'exemple pour afficher du contenu sur les pages publiques en local.",
  stack: ['Angular', 'NestJS', 'PostgreSQL'],
};

export const SAMPLE_SKILL: DeepPartial<Skill> = {
  name: 'TypeScript',
  category: 'Langages',
  order: 0,
};

export const SAMPLE_EXPERIENCE: DeepPartial<Experience> = {
  title: 'Développeur web',
  company: 'Entreprise exemple',
  location: 'Paris, France',
  startDate: 'Janvier 2023',
  description: "Développement et maintenance d'applications web.",
};

const seedTable = async <T extends ObjectLiteral>(
  app: INestApplicationContext,
  entity: new () => T,
  sample: DeepPartial<T>,
): Promise<void> => {
  const repository = app.get<Repository<T>>(getRepositoryToken(entity));
  if ((await repository.count()) === 0) {
    await repository.save(sample);
  }
};

export const seed = async (app: INestApplicationContext): Promise<void> => {
  await seedTable(app, Profile, SAMPLE_PROFILE);
  await seedTable(app, Project, SAMPLE_PROJECT);
  await seedTable(app, Skill, SAMPLE_SKILL);
  await seedTable(app, Experience, SAMPLE_EXPERIENCE);
};

const LOCAL_HOSTS = ['localhost', '127.0.0.1'];

export const assertLocalDatabase = (config: {
  get: (key: string) => string | undefined;
}): void => {
  if (config.get('DATABASE_SSL') !== 'false') {
    throw new Error('Seed refused: DATABASE_SSL must be "false".');
  }
  const url = config.get('DATABASE_URL');
  if (!url || !LOCAL_HOSTS.includes(new URL(url).hostname)) {
    throw new Error(
      'Seed refused: DATABASE_URL must point at localhost or 127.0.0.1.',
    );
  }
};

export const run = async (): Promise<void> => {
  try {
    assertLocalDatabase({ get: (key) => process.env[key] });
    const app = await NestFactory.createApplicationContext(SeedModule);
    try {
      await seed(app);
    } finally {
      await app.close();
    }
  } catch (error) {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  }
};

if (require.main === module) {
  void run();
}
