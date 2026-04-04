import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ExperienceCardComponent } from '../../core/components/experience-card/experience-card.component';
import { ExperiencesStore } from '../../store/experiences.store';

@Component({
  selector: 'app-experiences',
  standalone: true,
  imports: [ExperienceCardComponent],
  templateUrl: './experiences.component.html',
  styleUrl: './experiences.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperiencesComponent implements OnInit {
  store = inject(ExperiencesStore);

  ngOnInit(): void {
    if (this.store.experiences().length === 0) {
      this.store.loadExperiences();
    }
  }
}
