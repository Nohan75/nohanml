import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { Experience } from '../core/models/experience.model';
import { ExperiencesService } from '../core/services/experiences.service';

interface ExperiencesState {
  experiences: Experience[];
  loading: boolean;
  error: string | null;
}

const initialState: ExperiencesState = {
  experiences: [],
  loading: false,
  error: null,
};

export const ExperiencesStore = signalStore(
  { providedIn: 'root' },
  withState<ExperiencesState>(initialState),
  withMethods((store, service = inject(ExperiencesService)) => ({
    async loadExperiences(): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const experiences = await firstValueFrom(service.getAll());
        patchState(store, { experiences, loading: false });
      } catch {
        patchState(store, {
          error: 'Erreur lors du chargement des expériences',
          loading: false,
        });
      }
    },
  })),
);
