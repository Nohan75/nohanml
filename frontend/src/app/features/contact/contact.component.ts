import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContactService } from '../../core/services/contact.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {
  private fb = inject(FormBuilder);
  private contactService = inject(ContactService);

  sending = signal(false);
  sent = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  onSubmit(): void {
    if (this.form.invalid || this.sending()) return;

    this.sending.set(true);
    this.error.set(null);

    const { name, email, message } = this.form.getRawValue();

    this.contactService
      .send({
        name: name!,
        email: email!,
        message: message!,
        recaptchaToken: '',
      })
      .subscribe({
        next: () => {
          this.sent.set(true);
          this.sending.set(false);
          this.form.reset();
        },
        error: () => {
          this.error.set("Une erreur est survenue. Veuillez réessayer.");
          this.sending.set(false);
        },
      });
  }
}
