import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ZToastService } from '../../shared/ui/toast/z-toast.service';
import { API_BASE_URL, apiUrlInterceptor } from '../interceptors/api-url.interceptor';
import { problemDetailInterceptor } from '../interceptors/problem-detail.interceptor';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;
  let toastService: ZToastService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([problemDetailInterceptor, authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    toastService = TestBed.inject(ZToastService);
    router = TestBed.inject(Router);
    toastService.clear();
  });

  afterEach(() => {
    httpMock.verify();
    toastService.clear();
  });

  it('should deduplicate parallel 401 responses into a single refresh call and replay both requests silently', () => {
    let budgetsResult: unknown;
    let categoriesResult: unknown;

    http.get('/api/v1/budgets').subscribe((res) => (budgetsResult = res));
    http.get('/api/v1/categories').subscribe((res) => (categoriesResult = res));

    const req1 = httpMock.expectOne('/api/v1/budgets');
    const req2 = httpMock.expectOne('/api/v1/categories');
    expect(req1.request.withCredentials).toBe(true);
    expect(req2.request.withCredentials).toBe(true);

    req1.flush({ status: 401 }, { status: 401, statusText: 'Unauthorized' });
    req2.flush({ status: 401 }, { status: 401, statusText: 'Unauthorized' });

    // Exactly ONE refresh request in flight
    const refreshReq = httpMock.expectOne('/api/v1/auth/refresh');
    refreshReq.flush({ id: 'u1', email: 'dev@lumo.local', name: 'Dev', avatarUrl: null });

    // Both original requests replayed
    const retry1 = httpMock.expectOne('/api/v1/budgets');
    const retry2 = httpMock.expectOne('/api/v1/categories');
    retry1.flush([{ id: 'b1' }]);
    retry2.flush([{ id: 'c1' }]);

    expect(budgetsResult).toEqual([{ id: 'b1' }]);
    expect(categoriesResult).toEqual([{ id: 'c1' }]);
    expect(toastService.toasts()).toHaveLength(0);
  });

  it('should clear local auth state and redirect to /login when refresh fails', () => {
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    let failed = false;

    http.get('/api/v1/budgets').subscribe({ error: () => (failed = true) });

    const req = httpMock.expectOne('/api/v1/budgets');
    req.flush({ status: 401 }, { status: 401, statusText: 'Unauthorized' });

    const refreshReq = httpMock.expectOne('/api/v1/auth/refresh');
    refreshReq.flush({ status: 401 }, { status: 401, statusText: 'Unauthorized' });

    expect(failed).toBe(true);
    expect(authService.status()).toBe('unauthenticated');
    expect(navSpy).toHaveBeenCalledWith(['/login'], { queryParams: undefined });
  });

  it('should prefix api requests with API_BASE_URL and preserve single retry on 401 refresh', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: API_BASE_URL, useValue: 'https://api.lumo.example.com' },
        provideHttpClient(
          withInterceptors([problemDetailInterceptor, authInterceptor, apiUrlInterceptor])
        ),
        provideHttpClientTesting(),
      ],
    });

    const crossOriginHttp = TestBed.inject(HttpClient);
    const crossOriginHttpMock = TestBed.inject(HttpTestingController);
    let budgetsResult: unknown;

    crossOriginHttp.get('/api/v1/budgets').subscribe((res) => (budgetsResult = res));

    const firstReq = crossOriginHttpMock.expectOne('https://api.lumo.example.com/api/v1/budgets');
    expect(firstReq.request.withCredentials).toBe(true);
    firstReq.flush({ status: 401 }, { status: 401, statusText: 'Unauthorized' });

    const refreshReq = crossOriginHttpMock.expectOne(
      'https://api.lumo.example.com/api/v1/auth/refresh'
    );
    expect(refreshReq.request.withCredentials).toBe(true);
    refreshReq.flush({ id: 'u1', email: 'dev@lumo.local', name: 'Dev', avatarUrl: null });

    const retryReq = crossOriginHttpMock.expectOne('https://api.lumo.example.com/api/v1/budgets');
    expect(retryReq.request.withCredentials).toBe(true);
    retryReq.flush([{ id: 'b1' }]);

    expect(budgetsResult).toEqual([{ id: 'b1' }]);
    crossOriginHttpMock.verify();
  });
});
