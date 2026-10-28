import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SkillsService } from './skills.service';
import { AdminAuthService } from './admin-auth.service';
import { authInterceptor } from '../interceptors/auth.interceptor';
import { environment } from '../../../environments/environment';

describe('SkillsService', () => {
  let service: SkillsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AdminAuthService, useValue: { getToken: () => 'test-token' } },
      ],
    });
    service = TestBed.inject(SkillsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('writes', () => {
    it('creates through POST /admin/skills with the Bearer token', () => {
      service.create({ name: 'x' }).subscribe();
      const req = http.expectOne(`${environment.apiUrl}/admin/skills`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush({});
    });

    it('updates through PATCH /admin/skills/7 with the Bearer token', () => {
      service.update(7, { name: 'x' }).subscribe();
      const req = http.expectOne(`${environment.apiUrl}/admin/skills/7`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush({});
    });

    it('deletes through DELETE /admin/skills/7 with the Bearer token', () => {
      service.delete(7).subscribe();
      const req = http.expectOne(`${environment.apiUrl}/admin/skills/7`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush(null);
    });
  });

  describe('reads', () => {
    it('getAll reads GET /skills without an Authorization header', () => {
      service.getAll().subscribe();
      const req = http.expectOne(`${environment.apiUrl}/skills`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush([]);
    });
  });
});
