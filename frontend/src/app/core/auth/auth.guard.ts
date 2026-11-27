import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, sanitizeReturnUrl } from './auth.service';

export { sanitizeReturnUrl } from './auth.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const authenticated = await authService.ensureSessionLoaded();
  if (authenticated) {
    return true;
  }

  const returnUrl = sanitizeReturnUrl(state.url);
  return router.createUrlTree(['/login'], {
    queryParams: returnUrl === '/dashboard' ? undefined : { returnUrl },
  });
};

export const guestGuard: CanActivateFn = async (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const authenticated = await authService.ensureSessionLoaded();
  if (!authenticated) {
    return true;
  }

  const safeReturnUrl = sanitizeReturnUrl(route.queryParamMap.get('returnUrl'));
  return router.parseUrl(safeReturnUrl);
};
