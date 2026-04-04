import { inject, Injectable, signal } from '@angular/core';
import { ExperiencesStore } from '../../store/experiences.store';
import { ProfileStore } from '../../store/profile.store';
import { ProjectsStore } from '../../store/projects.store';
import { SkillsStore } from '../../store/skills.store';

@Injectable({ providedIn: 'root' })
export class AppLoadService {
  private profileStore = inject(ProfileStore);
  private projectsStore = inject(ProjectsStore);
  private experiencesStore = inject(ExperiencesStore);
  private skillsStore = inject(SkillsStore);

  private _ready = signal(false);
  readonly isReady = this._ready.asReadonly();

  async init(): Promise<void> {
    await Promise.all([
      this.profileStore.loadProfile(),
      this.projectsStore.loadProjects(),
      this.experiencesStore.loadExperiences(),
      this.skillsStore.loadSkills(),
    ]);
    this._ready.set(true);
  }
}
