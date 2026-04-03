import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Profile } from '../models/profile.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);

  get(): Observable<Profile> {
    return this.http.get<Profile>(`${environment.apiUrl}/profile`);
  }
}
