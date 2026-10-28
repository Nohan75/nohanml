import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AdminLoginComponent } from './admin-login.component';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { authInterceptor } from '../../../core/interceptors/auth.interceptor';
import { environment } from '../../../../environments/environment';

const TOKEN_KEY = 'admin_token';
const NOW_MS = 1_800_000_000_000;

function fakeToken(exp: number): string {
  const payload = btoa(JSON.stringify({ sub: 'admin', exp }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `header.${payload}.sig`;
}

describe('AdminLoginComponent', () => {
  beforeEach(() => {
    localStorage.removeItem(TOKEN_KEY);
    spyOn(Date, 'now').and.returnValue(NOW_MS);
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [{ path: 'admin/login', component: AdminLoginComponent }],
          withComponentInputBinding(),
        ),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
  });

  afterEach(() => localStorage.removeItem(TOKEN_KEY));

  async function openLogin(url: string) {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    harness.detectChanges();
    const el = harness.routeNativeElement as HTMLElement;
    const fill = (id: string, value: string) => {
      const input = el.querySelector<HTMLInputElement>(`#${id}`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    fill('email', 'admin@example.com');
    fill('password', 'secret');
    harness.detectChanges();
    const submit = () => {
      el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
      harness.detectChanges();
    };
    return { harness, el, submit };
  }

  it('shows the login error and stays on the page when the password is wrong', async () => {
    const authService = TestBed.inject(AdminAuthService);
    const expire = spyOn(authService, 'expireSession').and.callThrough();
    const { harness, el, submit } = await openLogin('/admin/login');
    const navigate = spyOn(TestBed.inject(Router), 'navigate');

    submit();
    TestBed.inject(HttpTestingController)
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    harness.detectChanges();

    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Identifiants incorrects.');
    expect(navigate).not.toHaveBeenCalled();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(expire).not.toHaveBeenCalled();
    expect(el.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBeFalse();
  });

  it('stores the new token, goes to the dashboard and drops the expiry message after logging in again', async () => {
    const authService = TestBed.inject(AdminAuthService);
    const { harness, el, submit } = await openLogin('/admin/login?session=expired');
    expect(el.querySelector('[role="status"]')).not.toBeNull();
    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    const token = fakeToken(NOW_MS / 1000 + 3600);

    submit();
    TestBed.inject(HttpTestingController)
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush({ access_token: token });
    harness.detectChanges();

    expect(localStorage.getItem(TOKEN_KEY)).toBe(token);
    expect(authService.isAuthenticated()).toBeTrue();
    expect(navigate).toHaveBeenCalledWith(['/admin/dashboard']);
    expect(el.querySelector('[role="status"]')).toBeNull();
  });
});
