import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PortfolioStats } from '../models/stats.model';

@Injectable({ providedIn: 'root' })
export class StatsService {
  private http = inject(HttpClient);

  getStats(): Observable<PortfolioStats> {
    return this.http.get<PortfolioStats>(`${environment.apiUrl}/admin/stats`);
  }
}
