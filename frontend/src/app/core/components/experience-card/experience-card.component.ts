import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Experience } from '../../models/experience.model';

@Component({
  selector: 'app-experience-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './experience-card.component.html',
  styleUrl: './experience-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceCardComponent {
  experience = input.required<Experience>();
}
