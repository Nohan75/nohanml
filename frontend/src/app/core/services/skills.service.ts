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
}
