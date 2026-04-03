import { inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withMethods,
  withState,
} from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { Profile } from '../core/models/profile.model';
import { ProfileService } from '../core/services/profile.service';

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

export const ProfileStore = signalStore(
  { providedIn: 'root' },
  withState<ProfileState>({ profile: null, loading: false, error: null }),
  withMethods((store, service = inject(ProfileService)) => ({
    async loadProfile(): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const profile = await firstValueFrom(service.get());
        patchState(store, { profile, loading: false });
      } catch {
        patchState(store, { error: 'Erreur lors du chargement du profil', loading: false });
      }
    },
  }))
);
