import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { AdminProjectsComponent } from './admin-projects.component';
import { environment } from '../../../../environments/environment';

describe('AdminProjectsComponent', () => {
  let fixture: ComponentFixture<AdminProjectsComponent>;
  let el: HTMLElement;
  let http: HttpTestingController;
  const api = environment.apiUrl;

  const portfolio = {
    id: 7,
    title: 'Portfolio',
    description: 'My site',
    stack: ['Angular', 'NestJS'],
    githubUrl: 'https://github.com/me/portfolio',
    liveUrl: 'https://me.dev',
    imageUrl: null,
    createdAt: '2026-01-01',
  };

  const step = async () => {
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const button = (text: string) =>
    Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.trim() === text) as HTMLButtonElement;
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
  const fillRequired = () => {
    fill('title', 'Nouveau');
    fill('description', 'Desc');
    fill('stack', 'Angular, NestJS');
  };
  const flushList = async () => {
    http.expectOne(`${api}/projects`).flush([portfolio]);
    await step();
  };
  const fail = (req: TestRequest) => req.flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [AdminProjectsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminProjectsComponent);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    await flushList();
  });

  afterEach(() => http.verify());

  it('creates a new project with one POST and no PATCH, then reloads the list and closes the form', async () => {
    click(button('+ Nouveau projet'));
    fillRequired();
    submit();

    const req = http.expectOne(`${api}/admin/projects`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...portfolio, id: 8 });
    await step();

    await flushList();
    expect(el.querySelector('form')).toBeNull();
  });

  it('updates an existing project with a PATCH on its id', async () => {
    click(labelled('Modifier Portfolio'));
    fill('title', 'Portfolio v2');
    submit();

    const req = http.expectOne(`${api}/admin/projects/7`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body.title).toBe('Portfolio v2');
    req.flush(portfolio);
    await step();
    await flushList();
  });

  it('sends null for the three URL fields left empty on creation', () => {
    click(button('+ Nouveau projet'));
    fillRequired();
    submit();

    const req = http.expectOne(`${api}/admin/projects`);
    expect(req.request.body.githubUrl).toBeNull();
    expect(req.request.body.liveUrl).toBeNull();
    expect(req.request.body.imageUrl).toBeNull();
    fail(req);
  });

  it('sends null for a cleared URL and keeps the others unchanged on update', () => {
    click(labelled('Modifier Portfolio'));
    fill('githubUrl', '');
    submit();

    const req = http.expectOne(`${api}/admin/projects/7`);
    expect(req.request.body.githubUrl).toBeNull();
    expect(req.request.body.liveUrl).toBe('https://me.dev');
    expect(req.request.body.imageUrl).toBeNull();
    fail(req);
  });

  describe('save error', () => {
    beforeEach(() => {
      click(labelled('Modifier Portfolio'));
      submit();
      fail(http.expectOne(`${api}/admin/projects/7`));
      fixture.detectChanges();
    });

    it('shows the save error in an alert', () => {
      expect(el.querySelector('[role="alert"]')?.textContent).toContain('Erreur lors de la sauvegarde.');
    });

    it('clears the save error on cancel', () => {
      click(button('Annuler'));
      click(button('+ Nouveau projet'));

      expect(el.querySelector('[role="alert"]')).toBeNull();
    });

    it('clears the save error on the next submit', () => {
      submit();

      expect(el.querySelector('[role="alert"]')).toBeNull();
      fail(http.expectOne(`${api}/admin/projects/7`));
    });
  });

  describe('delete', () => {
    it('shows an alert, keeps the project and does not reload when the delete fails', () => {
      spyOn(window, 'confirm').and.returnValue(true);

      click(labelled('Supprimer Portfolio'));
      fail(http.expectOne(`${api}/admin/projects/7`));
      fixture.detectChanges();

      expect(el.querySelector('form')).toBeNull();
      expect(el.querySelector('[role="alert"]')?.textContent).toContain('Erreur lors de la suppression.');
      expect(el.textContent).toContain('Portfolio');
      http.expectNone(`${api}/projects`);
    });
  });
});
