import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProjectsService } from './projects.service';
import { AdminAuthService } from './admin-auth.service';
import { authInterceptor } from '../interceptors/auth.interceptor';
import { environment } from '../../../environments/environment';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AdminAuthService, useValue: { getToken: () => 'test-token' } },
      ],
    });
    service = TestBed.inject(ProjectsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('writes', () => {
    it('creates through POST /admin/projects with the Bearer token', () => {
      service.create({ title: 'x' }).subscribe();
      const req = http.expectOne(`${environment.apiUrl}/admin/projects`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush({});
    });

    it('updates through PATCH /admin/projects/7 with the Bearer token', () => {
      service.update(7, { title: 'x' }).subscribe();
      const req = http.expectOne(`${environment.apiUrl}/admin/projects/7`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush({});
    });

    it('deletes through DELETE /admin/projects/7 with the Bearer token', () => {
      service.delete(7).subscribe();
      const req = http.expectOne(`${environment.apiUrl}/admin/projects/7`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush(null);
    });
  });

  describe('reads', () => {
    it('getAll reads GET /projects without an Authorization header', () => {
      service.getAll().subscribe();
      const req = http.expectOne(`${environment.apiUrl}/projects`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush([]);
    });

    it('getById(7) reads GET /projects/7 without an Authorization header', () => {
      service.getById(7).subscribe();
      const req = http.expectOne(`${environment.apiUrl}/projects/7`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({});
    });
  });
});
