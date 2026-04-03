import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectsStore } from '../../../store/projects.store';
import { ProjectsService } from '../../../core/services/projects.service';
import { Project } from '../../../core/models/project.model';

@Component({
  selector: 'app-admin-projects',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-projects.component.html',
  styleUrl: './admin-projects.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProjectsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private store = inject(ProjectsStore);
  private service = inject(ProjectsService);

  projects = this.store.projects;
  loading = this.store.loading;
  editing = signal<Project | null>(null);
  saving = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    stack: ['', Validators.required],
    githubUrl: [''],
    liveUrl: [''],
    imageUrl: [''],
  });

  ngOnInit(): void { this.store.loadProjects(); }

  startEdit(project: Project): void {
    this.editing.set(project);
    this.form.patchValue({ ...project, stack: project.stack.join(', ') });
  }

  cancelEdit(): void { this.editing.set(null); this.form.reset(); }

  onSubmit(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const payload = { ...raw, stack: raw.stack!.split(',').map((s) => s.trim()).filter(Boolean) };
    const current = this.editing();

    const req$ = current
      ? this.service.update(current.id, payload)
      : this.service.create(payload);

    req$.subscribe({
      next: () => { this.saving.set(false); this.cancelEdit(); this.store.loadProjects(); },
      error: () => { this.error.set('Erreur.'); this.saving.set(false); },
    });
  }

  delete(id: number): void {
    if (!confirm('Supprimer ce projet ?')) return;
    this.service.delete(id).subscribe({ next: () => this.store.loadProjects() });
  }
}
