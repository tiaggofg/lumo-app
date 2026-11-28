import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL, apiUrlInterceptor } from './api-url.interceptor';

describe('apiUrlInterceptor', () => {
  function setup(apiBaseUrl: string): { http: HttpClient; httpMock: HttpTestingController } {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: API_BASE_URL, useValue: apiBaseUrl },
        provideHttpClient(withInterceptors([apiUrlInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    return {
      http: TestBed.inject(HttpClient),
      httpMock: TestBed.inject(HttpTestingController),
    };
  }

  it('should prefix /api/ requests with API_BASE_URL and set withCredentials true', () => {
    const { http, httpMock } = setup('https://api.lumo.example.com///');

    http.get('/api/v1/budgets').subscribe();

    const req = httpMock.expectOne('https://api.lumo.example.com/api/v1/budgets');
    expect(req.request.withCredentials).toBe(true);
    req.flush([]);
    httpMock.verify();
  });

  it('should keep /api/ requests relative when API_BASE_URL is empty', () => {
    const { http, httpMock } = setup('');

    http.get('/api/v1/budgets').subscribe();

    const req = httpMock.expectOne('/api/v1/budgets');
    req.flush([]);
    httpMock.verify();
  });

  it('should not alter or duplicate prefix on already-absolute URLs', () => {
    const { http, httpMock } = setup('https://api.lumo.example.com');

    http.get('https://api.lumo.example.com/api/v1/budgets').subscribe();

    const req = httpMock.expectOne('https://api.lumo.example.com/api/v1/budgets');
    req.flush([]);
    httpMock.verify();
  });

  it('should not alter relative URLs outside /api/', () => {
    const { http, httpMock } = setup('https://api.lumo.example.com');

    http.get('/assets/config.json').subscribe();

    const req = httpMock.expectOne('/assets/config.json');
    req.flush({});
    httpMock.verify();
  });
});
