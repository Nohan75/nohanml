import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Skill } from '../models/skill.model';

@Injectable({ providedIn: 'root' })
export class SkillsService {
  private http = inject(HttpClient);

  getAll(): Observable<Skill[]> {
    return this.http.get<Skill[]>(`${environment.apiUrl}/skills`);
  }

  create(payload: Partial<Skill>): Observable<Skill> {
    return this.http.post<Skill>(`${environment.apiUrl}/skills`, payload);
  }

  update(id: number, payload: Partial<Skill>): Observable<Skill> {
    return this.http.patch<Skill>(`${environment.apiUrl}/skills/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/skills/${id}`);
  }
}
