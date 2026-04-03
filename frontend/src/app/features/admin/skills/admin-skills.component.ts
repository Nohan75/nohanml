import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SkillsStore } from '../../../store/skills.store';
import { SkillsService } from '../../../core/services/skills.service';
import { Skill } from '../../../core/models/skill.model';

@Component({
  selector: 'app-admin-skills',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-skills.component.html',
  styleUrl: './admin-skills.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSkillsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private store = inject(SkillsStore);
  private service = inject(SkillsService);

  skills = this.store.skills;
  categories = this.store.categories;
  loading = this.store.loading;
  editing = signal<Skill | null>(null);
  saving = signal(false);

  form = this.fb.group({
    name: ['', Validators.required],
    category: ['', Validators.required],
    order: [0],
  });

  ngOnInit(): void { this.store.loadSkills(); }

  startEdit(skill: Skill): void { this.editing.set(skill); this.form.patchValue(skill); }
  cancelEdit(): void { this.editing.set(null); this.form.reset({ order: 0 }); }

  onSubmit(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const current = this.editing();
    const req$ = current?.id
      ? this.service.update(current.id, raw)
      : this.service.create(raw);

    req$.subscribe({
      next: () => { this.saving.set(false); this.cancelEdit(); this.store.loadSkills(); },
      error: () => this.saving.set(false),
    });
  }

  delete(id: number): void {
    if (!confirm('Supprimer cette compétence ?')) return;
    this.service.delete(id).subscribe({ next: () => this.store.loadSkills() });
  }
}
