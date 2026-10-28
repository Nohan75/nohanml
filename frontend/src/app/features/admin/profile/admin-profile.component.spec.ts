import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminProfileComponent } from './admin-profile.component';
import { environment } from '../../../../environments/environment';

describe('AdminProfileComponent', () => {
  let fixture: ComponentFixture<AdminProfileComponent>;
  let el: HTMLElement;
  let http: HttpTestingController;
  const api = environment.apiUrl;

  const profile = {
    id: 1,
    heroTitle: 'Hello',
    heroSubtitle: 'World',
    bio: 'Bio',
    email: 'me@example.com',
    location: 'Paris',
    available: true,
    cvUrl: 'https://me.dev/cv.pdf',
    linkedinUrl: 'https://linkedin.com/in/me',
    githubUrl: null,
  };

  const step = async () => {
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const fill = (id: string, value: string) => {
    const input = el.querySelector(`#${id}`) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const submit = () => {
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [AdminProfileComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminProfileComponent);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    http.expectOne(`${api}/profile`).flush(profile);
    await step();
  });

  afterEach(() => http.verify());

  it('sends null for a cleared URL, keeps a URL left in place and sends null for an empty one', async () => {
    fill('cvUrl', '');
    submit();

    const req = http.expectOne(`${api}/admin/profile`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body.cvUrl).toBeNull();
    expect(req.request.body.linkedinUrl).toBe('https://linkedin.com/in/me');
    expect(req.request.body.githubUrl).toBeNull();
    req.flush(profile);
    await step();
    http.expectOne(`${api}/profile`).flush(profile);
  });
});
