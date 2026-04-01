import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ProjectCardComponent } from '../../core/components/project-card/project-card.component';
import { ProjectsStore } from '../../store/projects.store';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ProjectCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  store = inject(ProjectsStore);

  ngOnInit(): void {
    if (this.store.projects().length === 0) {
      this.store.loadProjects();
    }
  }
}
