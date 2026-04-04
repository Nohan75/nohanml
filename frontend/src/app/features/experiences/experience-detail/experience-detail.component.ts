import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ExperiencesService } from '../../../core/services/experiences.service';
import { Experience } from '../../../core/models/experience.model';

@Component({
  selector: 'app-experience-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './experience-detail.component.html',
  styleUrl: './experience-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private service = inject(ExperiencesService);

  experience = signal<Experience | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  lightboxIndex = signal<number | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.getById(id).subscribe({
      next: (exp) => {
        this.experience.set(exp);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Expérience introuvable.');
        this.loading.set(false);
      },
    });
  }

  openLightbox(index: number): void {
    this.lightboxIndex.set(index);
  }

  closeLightbox(): void {
    this.lightboxIndex.set(null);
  }

  prevPhoto(): void {
    const photos = this.experience()?.photos ?? [];
    const current = this.lightboxIndex();
    if (current === null) return;
    this.lightboxIndex.set((current - 1 + photos.length) % photos.length);
  }

  nextPhoto(): void {
    const photos = this.experience()?.photos ?? [];
    const current = this.lightboxIndex();
    if (current === null) return;
    this.lightboxIndex.set((current + 1) % photos.length);
  }
}
