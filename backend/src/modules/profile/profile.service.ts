import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './profile.entity';
import { CreateProfileDto, UpdateProfileDto } from './dto/profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private readonly repo: Repository<Profile>,
  ) {}

  async get(): Promise<Profile> {
    const profiles = await this.repo.find({ take: 1 });
    if (!profiles.length) throw new NotFoundException('Profile not found');
    return profiles[0];
  }

  async upsert(dto: CreateProfileDto): Promise<Profile> {
    const profiles = await this.repo.find({ take: 1 });
    const profile = profiles.length ? Object.assign(profiles[0], dto) : this.repo.create(dto);
    return this.repo.save(profile);
  }

  async update(dto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.get();
    Object.assign(profile, dto);
    return this.repo.save(profile);
  }
}
