import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { AdminAuthService } from './admin-auth.service';

const TOKEN_KEY = 'admin_token';
const NOW_MS = 1_800_000_000_000;

function fakeToken(exp: number): string {
  const payload = btoa(JSON.stringify({ sub: 'admin', exp }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `header.${payload}.sig`;
}

describe('AdminAuthService', () => {
  beforeEach(() => {
    localStorage.removeItem(TOKEN_KEY);
    spyOn(Date, 'now').and.returnValue(NOW_MS);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  afterEach(() => localStorage.removeItem(TOKEN_KEY));

  it('rejects, removes and records the expiry of a token whose exp is in the past', () => {
    localStorage.setItem(TOKEN_KEY, fakeToken(NOW_MS / 1000 - 60));

    const service = TestBed.inject(AdminAuthService);

    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(service.sessionExpired()).toBeTrue();
  });

  it('keeps a token whose exp is in the future', () => {
    const token = fakeToken(NOW_MS / 1000 + 3600);
    localStorage.setItem(TOKEN_KEY, token);

    const service = TestBed.inject(AdminAuthService);

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.getToken()).toBe(token);
  });

  it('treats malformed tokens as invalid and removes them', () => {
    const encode = (value: string) => btoa(value).replace(/=+$/, '');
    const malformed = [
      'garbage',
      `header.${encode('not json')}.sig`,
      `header.${encode(JSON.stringify({ sub: 'admin' }))}.sig`,
    ];

    for (const token of malformed) {
      localStorage.setItem(TOKEN_KEY, token);

      const authenticated = TestBed.inject(AdminAuthService).checkSession();

      expect(authenticated).withContext(token).toBeFalse();
      expect(localStorage.getItem(TOKEN_KEY)).withContext(token).toBeNull();
    }
  });

  it('logout removes the token and goes to the login page without the expiry reason', () => {
    localStorage.setItem(TOKEN_KEY, fakeToken(NOW_MS / 1000 + 3600));
    const service = TestBed.inject(AdminAuthService);
    const navigate = spyOn(TestBed.inject(Router), 'navigate');

    service.logout();

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.sessionExpired()).toBeFalse();
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/admin/login']);
  });
});
