import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmOptions } from '../database/typeorm.options';
import { Experience } from '../modules/experiences/experience.entity';
import { Profile } from '../modules/profile/profile.entity';
import { Project } from '../modules/projects/project.entity';
import { Skill } from '../modules/skills/skill.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: typeOrmOptions,
    }),
    TypeOrmModule.forFeature([Profile, Project, Skill, Experience]),
  ],
})
export class SeedModule {}
