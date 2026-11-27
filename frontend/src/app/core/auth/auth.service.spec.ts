import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService, sanitizeReturnUrl } from './auth.service';
import { AuthUser } from './auth.models';

describe('AuthService & sanitizeReturnUrl', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  const mockUser: AuthUser = {
    id: 'u-1',
    email: 'dev@lumo.local',
    name: 'Desenvolvedor Lumo',
    avatarUrl: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should deduplicate concurrent ensureSessionLoaded calls and populate user signal', async () => {
    const p1 = service.ensureSessionLoaded();
    const p2 = service.ensureSessionLoaded();

    const req = httpMock.expectOne('/api/v1/auth/me');
    expect(req.request.withCredentials).toBe(true);
    req.flush(mockUser);

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toBe(true);
    expect(r2).toBe(true);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.user()).toEqual(mockUser);
  });

  it('should set unauthenticated status when /auth/me fails', async () => {
    const p = service.ensureSessionLoaded();
    const req = httpMock.expectOne('/api/v1/auth/me');
    req.flush({ status: 401 }, { status: 401, statusText: 'Unauthorized' });

    expect(await p).toBe(false);
    expect(service.status()).toBe('unauthenticated');
    expect(service.user()).toBeNull();
  });

  it('should login as dev and logout clearing state and navigating to /login', async () => {
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const loginPromise = service.loginAsDev();
    const loginReq = httpMock.expectOne('/api/v1/auth/dev-login');
    expect(loginReq.request.method).toBe('POST');
    loginReq.flush(mockUser);
    expect(await loginPromise).toEqual(mockUser);
    expect(service.isAuthenticated()).toBe(true);

    const logoutPromise = service.logout();
    const logoutReq = httpMock.expectOne('/api/v1/auth/logout');
    expect(logoutReq.request.method).toBe('POST');
    logoutReq.flush(null, { status: 204, statusText: 'No Content' });
    await logoutPromise;

    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBeNull();
    expect(navSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should load providers and sanitize returnUrl against open redirects', async () => {
    const providersPromise = service.loadProviders();
    const req = httpMock.expectOne('/api/v1/auth/providers');
    req.flush({ googleEnabled: true, devLoginEnabled: true });
    expect(await providersPromise).toEqual({ googleEnabled: true, devLoginEnabled: true });

    expect(sanitizeReturnUrl('/budgets/123?tab=expenses')).toBe('/budgets/123?tab=expenses');
    expect(sanitizeReturnUrl(null)).toBe('/dashboard');
    expect(sanitizeReturnUrl('https://evil.com')).toBe('/dashboard');
    expect(sanitizeReturnUrl('//evil.com')).toBe('/dashboard');
    expect(sanitizeReturnUrl('/\\evil')).toBe('/dashboard');
    expect(sanitizeReturnUrl('/login')).toBe('/dashboard');
    expect(sanitizeReturnUrl('/login?error=oauth_failed')).toBe('/dashboard');
    expect(service.buildGoogleLoginUrl('/catalog')).toBe(
      '/api/v1/auth/google/login?returnUrl=%2Fcatalog'
    );
  });
});
