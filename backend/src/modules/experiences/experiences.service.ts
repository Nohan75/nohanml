import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Experience } from './experience.entity';
import { CreateExperienceDto, UpdateExperienceDto } from './dto/experience.dto';

@Injectable()
export class ExperiencesService {
  constructor(
    @InjectRepository(Experience)
    private readonly repo: Repository<Experience>,
  ) {}

  findAll(): Promise<Experience[]> {
    return this.repo.find({ order: { startDate: 'DESC' } });
  }

  async findOne(id: number): Promise<Experience> {
    const experience = await this.repo.findOneBy({ id });
    if (!experience) throw new NotFoundException(`Experience #${id} not found`);
    return experience;
  }

  create(dto: CreateExperienceDto): Promise<Experience> {
    const experience = this.repo.create({ ...dto, photos: dto.photos ?? [] });
    return this.repo.save(experience);
  }

  async update(id: number, dto: UpdateExperienceDto): Promise<Experience> {
    const experience = await this.findOne(id);
    Object.assign(experience, dto);
    return this.repo.save(experience);
  }

  async remove(id: number): Promise<void> {
    const experience = await this.findOne(id);
    await this.repo.remove(experience);
  }
}
