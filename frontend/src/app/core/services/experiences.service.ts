import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Experience } from '../models/experience.model';

@Injectable({ providedIn: 'root' })
export class ExperiencesService {
  private http = inject(HttpClient);

  getAll(): Observable<Experience[]> {
    return this.http.get<Experience[]>(`${environment.apiUrl}/experiences`);
  }

  getById(id: number): Observable<Experience> {
    return this.http.get<Experience>(`${environment.apiUrl}/experiences/${id}`);
  }

  create(payload: Partial<Experience>): Observable<Experience> {
    return this.http.post<Experience>(`${environment.apiUrl}/admin/experiences`, payload);
  }

  update(id: number, payload: Partial<Experience>): Observable<Experience> {
    return this.http.patch<Experience>(`${environment.apiUrl}/admin/experiences/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/admin/experiences/${id}`);
  }
}
