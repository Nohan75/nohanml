import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { AdminExperiencesComponent } from './admin-experiences.component';
import { environment } from '../../../../environments/environment';

describe('AdminExperiencesComponent', () => {
  let fixture: ComponentFixture<AdminExperiencesComponent>;
  let el: HTMLElement;
  let http: HttpTestingController;
  const api = environment.apiUrl;

  const experience = {
    id: 5,
    title: 'Dev Angular',
    company: 'Acme',
    location: 'Paris',
    startDate: 'Janvier 2023',
    endDate: 'Décembre 2023',
    description: 'Missions',
    thumbnailUrl: 'https://cdn.example.com/thumb.png',
    photos: [],
    createdAt: '2026-01-01',
  };

  const step = async () => {
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const labelled = (label: string) => el.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement;
  const click = (b: HTMLButtonElement) => {
    b.click();
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
  const fail = (req: TestRequest) => req.flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [AdminExperiencesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminExperiencesComponent);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    http.expectOne(`${api}/experiences`).flush([experience]);
    await step();
  });

  afterEach(() => http.verify());

  it('shows an alert, keeps the experience and does not reload when the delete fails', () => {
    spyOn(window, 'confirm').and.returnValue(true);

    click(labelled('Supprimer Dev Angular'));
    fail(http.expectOne(`${api}/admin/experiences/5`));
    fixture.detectChanges();

    expect(el.querySelector('form')).toBeNull();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Erreur lors de la suppression.');
    expect(el.textContent).toContain('Dev Angular');
    http.expectNone(`${api}/experiences`);
  });

  it('sends null for a cleared location, a cleared end date and a removed thumbnail', () => {
    click(labelled('Modifier Dev Angular'));
    fill('location', '');
    fill('endDate', '');
    click(labelled("Supprimer l'image"));
    submit();

    const req = http.expectOne(`${api}/admin/experiences/5`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body.location).toBeNull();
    expect(req.request.body.endDate).toBeNull();
    expect(req.request.body.thumbnailUrl).toBeNull();
    fail(req);
  });
});
