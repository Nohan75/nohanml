import { Routes } from '@angular/router';
import { adminAuthGuard } from '../../core/guards/admin-auth.guard';

export const adminRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login/admin-login.component').then((m) => m.AdminLoginComponent),
  },
  {
    path: '',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./profile/admin-profile.component').then((m) => m.AdminProfileComponent),
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./projects/admin-projects.component').then((m) => m.AdminProjectsComponent),
      },
      {
        path: 'skills',
        loadComponent: () =>
          import('./skills/admin-skills.component').then((m) => m.AdminSkillsComponent),
      },
      {
        path: 'experiences',
        loadComponent: () =>
          import('./experiences/admin-experiences.component').then((m) => m.AdminExperiencesComponent),
      },
    ],
  },
];
