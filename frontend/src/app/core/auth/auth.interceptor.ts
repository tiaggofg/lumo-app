import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService, sanitizeReturnUrl } from './auth.service';

const SKIP_REFRESH_PATHS = [
  '/api/v1/auth/refresh',
  '/api/v1/auth/logout',
  '/api/v1/auth/dev-login',
  '/api/v1/auth/providers',
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isApiRequest = req.url.startsWith('/api/');
  const outgoing = isApiRequest && !req.withCredentials ? req.clone({ withCredentials: true }) : req;

  return next(outgoing).pipe(
    catchError((error: unknown) => {
      if (
        !isApiRequest ||
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        SKIP_REFRESH_PATHS.some((path) => req.url.includes(path))
      ) {
        return throwError(() => error);
      }

      return authService.refreshSession().pipe(
        switchMap(() => next(outgoing)),
        catchError((refreshError: unknown) => {
          authService.clearLocalState();
          const currentUrl = router.url;
          if (!currentUrl.startsWith('/login') && !req.url.includes('/api/v1/auth/me')) {
            const safeReturnUrl = sanitizeReturnUrl(currentUrl);
            void router.navigate(['/login'], {
              queryParams: safeReturnUrl === '/dashboard' ? undefined : { returnUrl: safeReturnUrl },
            });
          }
          return throwError(() => refreshError);
        })
      );
    })
  );
};
