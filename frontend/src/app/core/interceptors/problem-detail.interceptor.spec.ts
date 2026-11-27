import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ZToastViewportComponent } from '../../shared/ui/toast/z-toast-viewport.component';
import { ZToastService } from '../../shared/ui/toast/z-toast.service';
import { problemDetailInterceptor } from './problem-detail.interceptor';

describe('problemDetailInterceptor & ZToastViewportComponent', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let toastService: ZToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ZToastViewportComponent],
      providers: [
        provideHttpClient(withInterceptors([problemDetailInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ZToastService);
    toastService.clear();
  });

  afterEach(() => {
    httpMock.verify();
    toastService.clear();
  });

  it('should surface RFC 9457 detail message in ZToastService on 409 conflict', () => {
    const addSpy = vi.spyOn(toastService, 'add');

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
    expect(toastService.toasts()).toHaveLength(1);
  });

  it('should format validation field errors when present', () => {
    const addSpy = vi.spyOn(toastService, 'add');

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

  it('should render floating ZardUI toast cards in ZToastViewportComponent and dismiss on click', () => {
    const fixture = TestBed.createComponent(ZToastViewportComponent);
    const id = toastService.add({
      severity: 'success',
      summary: 'Orçamento criado',
      detail: 'Recorrências materializadas com sucesso.',
      life: 0,
    });
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    expect(host.textContent).toContain('Orçamento criado');
    expect(host.textContent).toContain('Recorrências materializadas com sucesso.');

    const closeBtn: HTMLButtonElement | null = host.querySelector('button[aria-label="Fechar notificação"]');
    expect(closeBtn).toBeTruthy();
    closeBtn?.click();
    fixture.detectChanges();

    expect(toastService.toasts().some((t) => t.id === id)).toBe(false);
  });

  it('should not display an error toast on 401 from /api/v1/auth/me or /api/v1/auth/refresh', () => {
    const addSpy = vi.spyOn(toastService, 'add');

    http.get('/api/v1/auth/me').subscribe({ error: () => undefined });
    httpMock
      .expectOne('/api/v1/auth/me')
      .flush({ status: 401, title: 'Unauthorized', detail: 'Missing cookie' }, { status: 401, statusText: 'Unauthorized' });

    http.post('/api/v1/auth/refresh', {}).subscribe({ error: () => undefined });
    httpMock
      .expectOne('/api/v1/auth/refresh')
      .flush({ status: 401, title: 'Unauthorized', detail: 'Expired' }, { status: 401, statusText: 'Unauthorized' });

    expect(addSpy).not.toHaveBeenCalled();
    expect(toastService.toasts()).toHaveLength(0);
  });
});
