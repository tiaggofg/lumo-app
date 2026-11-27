import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ZToastService } from '../../shared/ui/toast/z-toast.service';
import { ProblemDetail } from '../models/api.models';

export const problemDetailInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ZToastService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const problem = extractProblemDetail(error);
        const summary = problem?.title ?? `Erro (${error.status || 'Conexão'})`;
        const detail =
          problem?.errors && problem.errors.length > 0
            ? problem.errors.map((e) => `${e.field}: ${e.message}`).join(' • ')
            : (problem?.detail ?? 'Não foi possível concluir a operação. Tente novamente.');

        toastService.add({
          severity: error.status === 404 || error.status === 409 ? 'warn' : 'error',
          summary,
          detail,
          life: 5000,
        });
      }
      return throwError(() => error);
    })
  );
};

function extractProblemDetail(error: HttpErrorResponse): ProblemDetail | null {
  const body = error.error;
  if (body && typeof body === 'object' && 'detail' in body && 'status' in body) {
    return body as ProblemDetail;
  }
  return null;
}
