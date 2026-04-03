import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { StatsService } from '../../../core/services/stats.service';
import { PortfolioStats } from '../../../core/models/stats.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent implements OnInit {
  private statsService = inject(StatsService);

  stats = signal<PortfolioStats | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.statsService.getStats().subscribe({
      next: (data) => { this.stats.set(data); this.loading.set(false); },
      error: () => { this.error.set('Erreur de chargement'); this.loading.set(false); },
    });
  }

  categoryEntries(): [string, number][] {
    return Object.entries(this.stats()?.skills.byCategory ?? {});
  }
}
