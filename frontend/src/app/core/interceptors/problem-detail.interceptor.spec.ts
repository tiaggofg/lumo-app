import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { problemDetailInterceptor } from './problem-detail.interceptor';

describe('problemDetailInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let messageService: MessageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MessageService,
        provideHttpClient(withInterceptors([problemDetailInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    messageService = TestBed.inject(MessageService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should surface RFC 9457 detail message in PrimeNG toast on 409 conflict', () => {
    const addSpy = vi.spyOn(messageService, 'add');

    http.post('/api/v1/budgets', { competenceMonth: '2026-11' }).subscribe({
      error: () => undefined,
    });

    const req = httpMock.expectOne('/api/v1/budgets');
    req.flush(
      {
        type: 'https://lumo.local/problems/resource-conflict',
        title: 'Resource Conflict',
        status: 409,
        detail: 'MonthlyBudget already exists for competence 2026-11.',
      },
      { status: 409, statusText: 'Conflict' }
    );

    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'warn',
        summary: 'Resource Conflict',
        detail: 'MonthlyBudget already exists for competence 2026-11.',
      })
    );
  });

  it('should format validation field errors when present', () => {
    const addSpy = vi.spyOn(messageService, 'add');

    http.post('/api/v1/categories', {}).subscribe({ error: () => undefined });

    const req = httpMock.expectOne('/api/v1/categories');
    req.flush(
      {
        type: 'https://lumo.local/problems/validation-error',
        title: 'Validation Error',
        status: 400,
        detail: 'Validation failed',
        errors: [{ field: 'name', message: 'must not be blank' }],
      },
      { status: 400, statusText: 'Bad Request' }
    );

    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        detail: 'name: must not be blank',
      })
    );
  });
});
