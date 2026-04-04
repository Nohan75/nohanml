import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ExperiencesStore } from '../../../store/experiences.store';
import { ExperiencesService } from '../../../core/services/experiences.service';
import { Experience } from '../../../core/models/experience.model';

@Component({
  selector: 'app-admin-experiences',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-experiences.component.html',
  styleUrl: './admin-experiences.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminExperiencesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private store = inject(ExperiencesStore);
  private service = inject(ExperiencesService);

  experiences = this.store.experiences;
  loading = this.store.loading;
  editing = signal<Experience | null>(null);
  saving = signal(false);
  error = signal<string | null>(null);

  photos = signal<string[]>([]);
  newPhotoUrl = signal('');

  form = this.fb.group({
    title: ['', Validators.required],
    company: ['', Validators.required],
    location: [''],
    startDate: ['', Validators.required],
    endDate: [''],
    description: ['', Validators.required],
    thumbnailUrl: [''],
  });

  ngOnInit(): void {
    this.store.loadExperiences();
  }

  startEdit(experience: Experience): void {
    this.editing.set(experience);
    this.photos.set([...experience.photos]);
    this.form.patchValue({
      title: experience.title,
      company: experience.company,
      location: experience.location ?? '',
      startDate: experience.startDate,
      endDate: experience.endDate ?? '',
      description: experience.description,
      thumbnailUrl: experience.thumbnailUrl ?? '',
    });
  }

  startCreate(): void {
    this.editing.set({ id: 0, title: '', company: '', startDate: '', description: '', photos: [], createdAt: '' });
    this.photos.set([]);
    this.form.reset();
  }

  cancelEdit(): void {
    this.editing.set(null);
    this.photos.set([]);
    this.newPhotoUrl.set('');
    this.form.reset();
    this.error.set(null);
  }

  addPhoto(): void {
    const url = this.newPhotoUrl().trim();
    if (!url) return;
    this.photos.update((list) => [...list, url]);
    this.newPhotoUrl.set('');
  }

  removePhoto(index: number): void {
    this.photos.update((list) => list.filter((_, i) => i !== index));
  }

  updateNewPhotoUrl(value: string): void {
    this.newPhotoUrl.set(value);
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.error.set(null);

    const raw = this.form.getRawValue();
    const payload: Partial<Experience> = {
      title: raw.title ?? undefined,
      company: raw.company ?? undefined,
      location: raw.location || undefined,
      startDate: raw.startDate ?? undefined,
      endDate: raw.endDate || undefined,
      description: raw.description ?? undefined,
      thumbnailUrl: raw.thumbnailUrl || undefined,
      photos: this.photos(),
    };

    const current = this.editing();
    const req$ = current && current.id !== 0
      ? this.service.update(current.id, payload)
      : this.service.create(payload);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelEdit();
        this.store.loadExperiences();
      },
      error: () => {
        this.error.set('Une erreur est survenue.');
        this.saving.set(false);
      },
    });
  }

  delete(id: number): void {
    if (!confirm('Supprimer cette expérience ?')) return;
    this.service.delete(id).subscribe({ next: () => this.store.loadExperiences() });
  }
}
