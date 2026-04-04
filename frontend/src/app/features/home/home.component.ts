import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProjectCardComponent } from '../../core/components/project-card/project-card.component';
import { SkeletonCardComponent } from '../../core/components/skeleton-card/skeleton-card.component';
import { ProjectsStore } from '../../store/projects.store';
import { ProfileStore } from '../../store/profile.store';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, ProjectCardComponent, SkeletonCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  projectsStore = inject(ProjectsStore);
  profileStore = inject(ProfileStore);

  ngOnInit(): void {
    if (this.projectsStore.projects().length === 0) {
      this.projectsStore.loadProjects();
    }
    if (!this.profileStore.profile()) {
      this.profileStore.loadProfile();
    }
  }
}
