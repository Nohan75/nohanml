import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';

export const adminAuthGuard: CanActivateFn & CanActivateChildFn = () => {
  const authService = inject(AdminAuthService);
  const router = inject(Router);

  if (authService.checkSession()) return true;

  return router.parseUrl(
    authService.sessionExpired() ? '/admin/login?session=expired' : '/admin/login',
  );
};
