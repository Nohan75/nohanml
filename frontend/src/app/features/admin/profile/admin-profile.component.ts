import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileService } from '../../../core/services/profile.service';
import { ProfileStore } from '../../../store/profile.store';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-profile.component.html',
  styleUrl: './admin-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);
  private profileStore = inject(ProfileStore);

  saving = signal(false);
  saved = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group({
    heroTitle: ['', Validators.required],
    heroSubtitle: ['', Validators.required],
    bio: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    location: ['', Validators.required],
    available: [true],
    cvUrl: [''],
    linkedinUrl: [''],
    githubUrl: [''],
  });

  ngOnInit(): void {
    this.profileStore.loadProfile().then(() => {
      const p = this.profileStore.profile();
      if (p) this.form.patchValue({ ...p });
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.saved.set(false);
    this.error.set(null);

    const raw = this.form.getRawValue();

    this.profileService.patch(raw).subscribe({
      next: () => { this.saved.set(true); this.saving.set(false); this.profileStore.loadProfile(); },
      error: () => { this.error.set('Erreur lors de la sauvegarde.'); this.saving.set(false); },
    });
  }
}
