import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '../projects/project.entity';
import { Skill } from '../skills/skill.entity';
import { Profile } from '../profile/profile.entity';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Skill, Profile]),
    AuthModule,
  ],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
