import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { Project } from '../core/models/project.model';
import { ProjectsService } from '../core/services/projects.service';

interface ProjectsState {
  projects: Project[];
  loading: boolean;
  error: string | null;
}

const initialState: ProjectsState = {
  projects: [],
  loading: false,
  error: null,
};

export const ProjectsStore = signalStore(
  { providedIn: 'root' },
  withState<ProjectsState>(initialState),
  withComputed(({ projects }) => ({
    latestProjects: computed(() => projects().slice(0, 3)),
    total: computed(() => projects().length),
  })),
  withMethods((store, service = inject(ProjectsService)) => ({
    async loadProjects(): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const projects = await firstValueFrom(service.getAll());
        patchState(store, { projects, loading: false });
      } catch {
        patchState(store, { error: 'Erreur lors du chargement des projets', loading: false });
      }
    },
  }))
);
