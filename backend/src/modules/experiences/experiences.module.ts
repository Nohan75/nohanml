import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Experience } from './experience.entity';
import { ExperiencesPublicController, ExperiencesAdminController } from './experiences.controller';
import { ExperiencesService } from './experiences.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Experience]), AuthModule],
  controllers: [ExperiencesPublicController, ExperiencesAdminController],
  providers: [ExperiencesService],
})
export class ExperiencesModule {}
