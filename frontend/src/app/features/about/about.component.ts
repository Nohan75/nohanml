import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { SkillsStore } from '../../store/skills.store';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent implements OnInit {
  store = inject(SkillsStore);

  ngOnInit(): void {
    if (this.store.skills().length === 0) {
      this.store.loadSkills();
    }
  }
}
