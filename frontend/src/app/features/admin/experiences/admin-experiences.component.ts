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
import { UploadService } from '../../../core/services/upload.service';
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
  private uploadService = inject(UploadService);

  experiences = this.store.experiences;
  loading = this.store.loading;
  editing = signal<Experience | null>(null);
  saving = signal(false);
  error = signal<string | null>(null);

  thumbnailUrl = signal<string | null>(null);
  thumbnailUploading = signal(false);
  photos = signal<string[]>([]);
  photoUploading = signal(false);

  form = this.fb.group({
    title: ['', Validators.required],
    company: ['', Validators.required],
    location: [''],
    startDate: ['', Validators.required],
    endDate: [''],
    description: ['', Validators.required],
  });

  ngOnInit(): void {
    this.store.loadExperiences();
  }

  startEdit(experience: Experience): void {
    this.editing.set(experience);
    this.thumbnailUrl.set(experience.thumbnailUrl ?? null);
    this.photos.set([...experience.photos]);
    this.form.patchValue({
      title: experience.title,
      company: experience.company,
      location: experience.location ?? '',
      startDate: experience.startDate,
      endDate: experience.endDate ?? '',
      description: experience.description,
    });
  }

  startCreate(): void {
    this.editing.set({ id: 0, title: '', company: '', startDate: '', description: '', photos: [], createdAt: '' });
    this.thumbnailUrl.set(null);
    this.photos.set([]);
    this.form.reset();
    this.error.set(null);
  }

  cancelEdit(): void {
    this.editing.set(null);
    this.thumbnailUrl.set(null);
    this.photos.set([]);
    this.error.set(null);
    this.form.reset();
  }

  onThumbnailSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.thumbnailUploading.set(true);
    this.uploadService.upload(file, 'experiences/thumbnails').subscribe({
      next: ({ url }) => {
        this.thumbnailUrl.set(url);
        this.thumbnailUploading.set(false);
      },
      error: () => {
        this.error.set("Erreur lors de l'upload de l'image de couverture.");
        this.thumbnailUploading.set(false);
      },
    });
  }

  removeThumbnail(): void {
    this.thumbnailUrl.set(null);
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;
    this.photoUploading.set(true);
    const fileArray = Array.from(files);
    let remaining = fileArray.length;
    for (const file of fileArray) {
      this.uploadService.upload(file, 'experiences/photos').subscribe({
        next: ({ url }) => {
          this.photos.update((list) => [...list, url]);
          remaining--;
          if (remaining === 0) this.photoUploading.set(false);
        },
        error: () => {
          this.error.set("Erreur lors de l'upload d'une photo.");
          remaining--;
          if (remaining === 0) this.photoUploading.set(false);
        },
      });
    }
    input.value = '';
  }

  removePhoto(index: number): void {
    this.photos.update((list) => list.filter((_, i) => i !== index));
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
      thumbnailUrl: this.thumbnailUrl() ?? undefined,
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
