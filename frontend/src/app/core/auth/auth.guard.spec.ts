import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  convertToParamMap,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { authGuard, guestGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard & guestGuard', () => {
  let authServiceMock: { ensureSessionLoaded: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(() => {
    authServiceMock = {
      ensureSessionLoaded: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceMock }],
    });
    router = TestBed.inject(Router);
  });

  it('authGuard should allow authenticated navigation and redirect unauthenticated with returnUrl', async () => {
    authServiceMock.ensureSessionLoaded.mockResolvedValueOnce(true);
    const allowed = await TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/budgets' } as RouterStateSnapshot)
    );
    expect(allowed).toBe(true);

    authServiceMock.ensureSessionLoaded.mockResolvedValueOnce(false);
    const redirected = await TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/budgets/42' } as RouterStateSnapshot)
    );
    expect(redirected instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(redirected as UrlTree)).toBe('/login?returnUrl=%2Fbudgets%2F42');
  });

  it('guestGuard should allow unauthenticated visitor and redirect authenticated user to sanitized returnUrl', async () => {
    authServiceMock.ensureSessionLoaded.mockResolvedValueOnce(false);
    const guestRoute = { queryParamMap: convertToParamMap({}) } as ActivatedRouteSnapshot;
    const allowed = await TestBed.runInInjectionContext(() =>
      guestGuard(guestRoute, { url: '/login' } as RouterStateSnapshot)
    );
    expect(allowed).toBe(true);

    authServiceMock.ensureSessionLoaded.mockResolvedValueOnce(true);
    const withReturnUrl = {
      queryParamMap: convertToParamMap({ returnUrl: '/recurrences' }),
    } as ActivatedRouteSnapshot;
    const redirected = await TestBed.runInInjectionContext(() =>
      guestGuard(withReturnUrl, { url: '/login?returnUrl=%2Frecurrences' } as RouterStateSnapshot)
    );
    expect(redirected instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(redirected as UrlTree)).toBe('/recurrences');

    authServiceMock.ensureSessionLoaded.mockResolvedValueOnce(true);
    const evilReturnUrl = {
      queryParamMap: convertToParamMap({ returnUrl: 'https://evil.com' }),
    } as ActivatedRouteSnapshot;
    const safeRedirect = await TestBed.runInInjectionContext(() =>
      guestGuard(evilReturnUrl, { url: '/login' } as RouterStateSnapshot)
    );
    expect(router.serializeUrl(safeRedirect as UrlTree)).toBe('/dashboard');
  });
});
