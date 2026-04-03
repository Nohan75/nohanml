import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Skill } from './skill.entity';
import { CreateSkillDto, UpdateSkillDto } from './dto/skill.dto';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly repo: Repository<Skill>,
  ) {}

  findAll(): Promise<Skill[]> {
    return this.repo.find({ order: { category: 'ASC', order: 'ASC', name: 'ASC' } });
  }

  async findOne(id: number): Promise<Skill> {
    const skill = await this.repo.findOneBy({ id });
    if (!skill) throw new NotFoundException(`Skill #${id} not found`);
    return skill;
  }

  create(dto: CreateSkillDto): Promise<Skill> {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: number, dto: UpdateSkillDto): Promise<Skill> {
    const skill = await this.findOne(id);
    Object.assign(skill, dto);
    return this.repo.save(skill);
  }

  async remove(id: number): Promise<void> {
    const skill = await this.findOne(id);
    await this.repo.remove(skill);
  }
}
