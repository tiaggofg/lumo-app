import { HttpInterceptorFn } from '@angular/common/http';
import { InjectionToken, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

export function normalizeApiBaseUrl(rawUrl: string | null | undefined): string {
  return (rawUrl ?? '').trim().replace(/\/+$/, '');
}

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => normalizeApiBaseUrl(environment.apiUrl),
});

export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const baseUrl = normalizeApiBaseUrl(inject(API_BASE_URL));
  if (!baseUrl || !req.url.startsWith('/api/')) {
    return next(req);
  }
  return next(
    req.clone({
      url: `${baseUrl}${req.url}`,
      withCredentials: true,
    })
  );
};
