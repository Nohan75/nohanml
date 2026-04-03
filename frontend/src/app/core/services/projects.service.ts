import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Project } from '../models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private http = inject(HttpClient);

  getAll(): Observable<Project[]> {
    return this.http.get<Project[]>(`${environment.apiUrl}/projects`);
  }

  getById(id: number): Observable<Project> {
    return this.http.get<Project>(`${environment.apiUrl}/projects/${id}`);
  }

  create(payload: Partial<Project>): Observable<Project> {
    return this.http.post<Project>(`${environment.apiUrl}/projects`, payload);
  }

  update(id: number, payload: Partial<Project>): Observable<Project> {
    return this.http.patch<Project>(`${environment.apiUrl}/projects/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/projects/${id}`);
  }
}
