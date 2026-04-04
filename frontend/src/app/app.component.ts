import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './core/components/navbar/navbar.component';
import { SplashScreenComponent } from './core/components/splash-screen/splash-screen.component';
import { AppLoadService } from './core/services/app-load.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SplashScreenComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  private themeService = inject(ThemeService);
  private appLoad = inject(AppLoadService);

  readonly showSplash = signal(true);
  readonly splashHiding = signal(false);

  ngOnInit(): void {
    this.themeService.init();
    this.appLoad.init().then(() => {
      this.splashHiding.set(true);
      setTimeout(() => this.showSplash.set(false), 550);
    });
  }
}
