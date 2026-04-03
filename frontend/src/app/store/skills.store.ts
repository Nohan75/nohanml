import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { Skill } from '../core/models/skill.model';
import { SkillsService } from '../core/services/skills.service';

interface SkillsState {
  skills: Skill[];
  loading: boolean;
  error: string | null;
}

export const SkillsStore = signalStore(
  { providedIn: 'root' },
  withState<SkillsState>({ skills: [], loading: false, error: null }),
  withComputed(({ skills }) => ({
    categories: computed(() => [...new Set(skills().map((s) => s.category))]),
  })),
  withMethods((store, service = inject(SkillsService)) => ({
    async loadSkills(): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const skills = await firstValueFrom(service.getAll());
        patchState(store, { skills, loading: false });
      } catch {
        patchState(store, { error: 'Erreur lors du chargement des compétences', loading: false });
      }
    },
    skillsByCategory(category: string): Skill[] {
      return store.skills().filter((s) => s.category === category);
    },
  }))
);
