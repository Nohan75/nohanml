import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmOptions } from './database/typeorm.options';
import { ProjectsModule } from './modules/projects/projects.module';
import { SkillsModule } from './modules/skills/skills.module';
import { ProfileModule } from './modules/profile/profile.module';
import { ContactModule } from './modules/contact/contact.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { StatsModule } from './modules/stats/stats.module';
import { ExperiencesModule } from './modules/experiences/experiences.module';
import { UploadModule } from './modules/upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: typeOrmOptions,
    }),
    ProjectsModule,
    SkillsModule,
    ProfileModule,
    ContactModule,
    HealthModule,
    AuthModule,
    StatsModule,
    ExperiencesModule,
    UploadModule,
  ],
})
export class AppModule {}
