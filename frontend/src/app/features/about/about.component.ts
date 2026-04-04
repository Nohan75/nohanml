import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { SkillsStore } from '../../store/skills.store';
import { ProfileStore } from '../../store/profile.store';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent implements OnInit {
  skillsStore = inject(SkillsStore);
  profileStore = inject(ProfileStore);

  readonly skeletonCategories = [
    Array(4),
    Array(5),
    Array(3),
  ];

  ngOnInit(): void {
    if (this.skillsStore.skills().length === 0) {
      this.skillsStore.loadSkills();
    }
    if (!this.profileStore.profile()) {
      this.profileStore.loadProfile();
    }
  }
}
