import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../projects/project.entity';
import { Skill } from '../skills/skill.entity';
import { Profile } from '../profile/profile.entity';

export interface PortfolioStats {
  projects: {
    total: number;
    latest: { title: string; createdAt: Date } | null;
  };
  skills: {
    total: number;
    byCategory: Record<string, number>;
  };
  profile: {
    completeness: number;
    available: boolean;
  };
}

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(Skill)
    private readonly skillRepo: Repository<Skill>,
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,
  ) {}

  async getStats(): Promise<PortfolioStats> {
    const [projects, skills, profiles] = await Promise.all([
      this.projectRepo.find({ order: { createdAt: 'DESC' } }),
      this.skillRepo.find(),
      this.profileRepo.find({ take: 1 }),
    ]);

    const profile = profiles[0] ?? null;

    // Skills par catégorie
    const byCategory: Record<string, number> = {};
    for (const skill of skills) {
      byCategory[skill.category] = (byCategory[skill.category] ?? 0) + 1;
    }

    // Complétude du profil
    let filled = 0;
    const fields = ['heroTitle', 'heroSubtitle', 'bio', 'email', 'location', 'cvUrl', 'linkedinUrl', 'githubUrl'] as const;
    if (profile) {
      for (const field of fields) {
        if (profile[field]) filled++;
      }
    }
    const completeness = profile ? Math.round((filled / fields.length) * 100) : 0;

    return {
      projects: {
        total: projects.length,
        latest: projects[0] ? { title: projects[0].title, createdAt: projects[0].createdAt } : null,
      },
      skills: {
        total: skills.length,
        byCategory,
      },
      profile: {
        completeness,
        available: profile?.available ?? false,
      },
    };
  }
}
