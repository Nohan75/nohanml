import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Skill } from './skill.entity';
import { SkillsPublicController, SkillsAdminController } from './skills.controller';
import { SkillsService } from './skills.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Skill]), AuthModule],
  controllers: [SkillsPublicController, SkillsAdminController],
  providers: [SkillsService],
})
export class SkillsModule {}
