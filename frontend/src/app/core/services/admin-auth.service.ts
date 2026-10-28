import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';

interface JwtPayload {
  exp?: unknown;
}

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly TOKEN_KEY = 'admin_token';

  isAuthenticated = signal<boolean>(false);

  private _sessionExpired = signal(false);
  readonly sessionExpired = this._sessionExpired.asReadonly();

  constructor() {
    this.checkSession();
  }

  login(email: string, password: string) {
    return this.http
      .post<{ access_token: string }>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(({ access_token }) => {
          localStorage.setItem(this.TOKEN_KEY, access_token);
          this.isAuthenticated.set(true);
          this._sessionExpired.set(false);
        }),
      );
  }

  logout(): void {
    this.endSession(false);
    this.router.navigate(['/admin/login']);
  }

  expireSession(): void {
    this.endSession(true);
    this.router.navigate(['/admin/login'], { queryParams: { session: 'expired' } });
  }

  /** Re-reads the stored token: an expired or unreadable one ends the session as expired. */
  checkSession(): boolean {
    const token = this.getToken();

    if (token === null) {
      this.isAuthenticated.set(false);
    } else if (this.isUnexpired(token)) {
      this.isAuthenticated.set(true);
      this._sessionExpired.set(false);
    } else {
      this.endSession(true);
    }

    return this.isAuthenticated();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private endSession(expired: boolean): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.isAuthenticated.set(false);
    this._sessionExpired.set(expired);
  }

  private isUnexpired(token: string): boolean {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    try {
      const payload: JwtPayload | null = JSON.parse(
        atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')),
      );
      return typeof payload?.exp === 'number' && payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }
}
