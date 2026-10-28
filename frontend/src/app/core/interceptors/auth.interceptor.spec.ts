import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AdminAuthService } from '../services/admin-auth.service';
import { environment } from '../../../environments/environment';

describe('authInterceptor error handling', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let authService: jasmine.SpyObj<AdminAuthService>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AdminAuthService>('AdminAuthService', [
      'getToken',
      'expireSession',
    ]);
    authService.getToken.and.returnValue('test-token');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AdminAuthService, useValue: authService },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  function failWith(url: string, status: number): HttpErrorResponse | undefined {
    let received: HttpErrorResponse | undefined;
    http.get(url).subscribe({ error: (e: HttpErrorResponse) => (received = e) });
    controller.expectOne(url).flush({ message: 'nope' }, { status, statusText: 'Error' });
    return received;
  }

  it('expires the session once on a 401 from an admin URL and still delivers the error', () => {
    const error = failWith(`${environment.apiUrl}/admin/projects`, 401);

    expect(authService.expireSession).toHaveBeenCalledTimes(1);
    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect(error?.status).toBe(401);
  });

  for (const status of [500, 0]) {
    it(`does not expire the session on a ${status} from an admin URL and delivers the error`, () => {
      const error = failWith(`${environment.apiUrl}/admin/projects`, status);

      expect(authService.expireSession).not.toHaveBeenCalled();
      expect(error?.status).toBe(status);
    });
  }

  it('does not expire the session on a 401 from a non-admin URL and delivers the error', () => {
    const error = failWith(`${environment.apiUrl}/auth/login`, 401);

    expect(authService.expireSession).not.toHaveBeenCalled();
    expect(error?.status).toBe(401);
  });
});
