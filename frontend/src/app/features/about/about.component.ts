import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

interface Skill {
  name: string;
  category: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [NgOptimizedImage],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent {
  skills: Skill[] = [
    { name: 'Angular', category: 'Frontend' },
    { name: 'TypeScript', category: 'Frontend' },
    { name: 'SCSS', category: 'Frontend' },
    { name: 'RxJS', category: 'Frontend' },
    { name: 'NgRx', category: 'Frontend' },
    { name: 'NestJS', category: 'Backend' },
    { name: 'Node.js', category: 'Backend' },
    { name: 'PostgreSQL', category: 'Backend' },
    { name: 'TypeORM', category: 'Backend' },
    { name: 'REST API', category: 'Backend' },
    { name: 'Docker', category: 'DevOps' },
    { name: 'GitHub Actions', category: 'DevOps' },
  ];

  categories = [...new Set(this.skills.map((s) => s.category))];

  skillsByCategory(category: string): Skill[] {
    return this.skills.filter((s) => s.category === category);
  }
}
