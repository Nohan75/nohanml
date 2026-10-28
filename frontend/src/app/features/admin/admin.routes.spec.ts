import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { adminRoutes } from './admin.routes';
import { authInterceptor } from '../../core/interceptors/auth.interceptor';

const TOKEN_KEY = 'admin_token';
const NOW_MS = 1_800_000_000_000;

function fakeToken(exp: number): string {
  const payload = btoa(JSON.stringify({ sub: 'admin', exp }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `header.${payload}.sig`;
}

describe('admin routes', () => {
  beforeEach(() => {
    localStorage.removeItem(TOKEN_KEY);
    spyOn(Date, 'now').and.returnValue(NOW_MS);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'admin', children: adminRoutes }], withComponentInputBinding()),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
  });

  afterEach(() => localStorage.removeItem(TOKEN_KEY));

  it('sends an expired token to the login page with the expiry message and removes the token', async () => {
    localStorage.setItem(TOKEN_KEY, fakeToken(NOW_MS / 1000 - 60));

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin');
    harness.detectChanges();

    expect(TestBed.inject(Router).url).toBe('/admin/login?session=expired');
    const status = (harness.routeNativeElement as HTMLElement).querySelector('[role="status"]');
    expect(status?.textContent).toContain('Session expirée, reconnecte-toi.');
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('catches a token that expires between two admin pages at the next navigation', async () => {
    localStorage.setItem(TOKEN_KEY, fakeToken(NOW_MS / 1000 + 60));
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin/dashboard');
    TestBed.inject(HttpTestingController)
      .expectOne((r) => r.url.endsWith('/admin/stats'))
      .flush({});

    (Date.now as jasmine.Spy).and.returnValue(NOW_MS + 120_000);
    await harness.navigateByUrl('/admin/projects');
    harness.detectChanges();

    expect(TestBed.inject(Router).url).toBe('/admin/login?session=expired');
    const status = (harness.routeNativeElement as HTMLElement).querySelector('[role="status"]');
    expect(status?.textContent).toContain('Session expirée, reconnecte-toi.');
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('sends a visitor without token to the login page without the expiry message', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin');
    harness.detectChanges();

    expect(TestBed.inject(Router).url).toBe('/admin/login');
    expect((harness.routeNativeElement as HTMLElement).querySelector('[role="status"]')).toBeNull();
  });

  it('sends the admin to the login page with the expiry message when an admin request answers 401', async () => {
    localStorage.setItem(TOKEN_KEY, fakeToken(NOW_MS / 1000 + 3600));
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin/dashboard');

    TestBed.inject(HttpTestingController)
      .expectOne((r) => r.url.endsWith('/admin/stats'))
      .flush({ message: 'Token invalide ou expiré' }, { status: 401, statusText: 'Unauthorized' });
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(TestBed.inject(Router).url).toBe('/admin/login?session=expired');
    const status = (harness.routeNativeElement as HTMLElement).querySelector('[role="status"]');
    expect(status?.textContent).toContain('Session expirée, reconnecte-toi.');
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});
