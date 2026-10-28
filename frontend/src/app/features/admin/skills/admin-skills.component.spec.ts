import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { AdminSkillsComponent } from './admin-skills.component';
import { environment } from '../../../../environments/environment';

describe('AdminSkillsComponent', () => {
  let fixture: ComponentFixture<AdminSkillsComponent>;
  let el: HTMLElement;
  let http: HttpTestingController;
  const api = environment.apiUrl;

  const angular = { id: 3, name: 'Angular', category: 'Frontend', order: 1 };

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
  const fail = (req: TestRequest) => req.flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [AdminSkillsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminSkillsComponent);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    http.expectOne(`${api}/skills`).flush([angular]);
    await step();
  });

  afterEach(() => http.verify());

  describe('failed save', () => {
    beforeEach(() => {
      click(button('+ Nouvelle compétence'));
      fill('name', 'NestJS');
      fill('category', 'Backend');
      submit();
      fail(http.expectOne(`${api}/admin/skills`));
      fixture.detectChanges();
    });

    it('shows an alert in the form, re-enables the button and keeps the typed values', () => {
      const alert = el.querySelector('form [role="alert"]');
      const save = button('Sauvegarder');

      expect(alert?.textContent).toContain('Erreur lors de la sauvegarde.');
      expect(save).toBeTruthy();
      expect(save.disabled).toBeFalse();
      expect((el.querySelector('#name') as HTMLInputElement).value).toBe('NestJS');
      expect((el.querySelector('#category') as HTMLInputElement).value).toBe('Backend');
    });

    it('removes the alert after cancel and a new skill form', () => {
      expect(el.querySelector('[role="alert"]')).not.toBeNull();
      click(button('Annuler'));
      click(button('+ Nouvelle compétence'));

      expect(el.querySelector('[role="alert"]')).toBeNull();
    });

    it('removes the alert on the next submit', () => {
      expect(el.querySelector('[role="alert"]')).not.toBeNull();
      submit();

      expect(el.querySelector('[role="alert"]')).toBeNull();
      fail(http.expectOne(`${api}/admin/skills`));
    });
  });

  it('shows an alert, keeps the skill and does not reload when the delete fails', () => {
    spyOn(window, 'confirm').and.returnValue(true);

    click(labelled('Supprimer Angular'));
    fail(http.expectOne(`${api}/admin/skills/3`));
    fixture.detectChanges();

    expect(el.querySelector('form')).toBeNull();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Erreur lors de la suppression.');
    expect(el.textContent).toContain('Angular');
    http.expectNone(`${api}/skills`);
  });
});
