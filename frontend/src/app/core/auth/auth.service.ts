import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, finalize, firstValueFrom, shareReplay, tap } from 'rxjs';
import { AuthProviders, AuthStatus, AuthUser } from './auth.models';

export function sanitizeReturnUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl) {
    return '/dashboard';
  }
  const trimmed = rawUrl.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
    return '/dashboard';
  }
  if (trimmed.includes('://') || trimmed.includes('\r') || trimmed.includes('\n')) {
    return '/dashboard';
  }
  if (trimmed === '/' || trimmed === '/login' || trimmed.startsWith('/login?')) {
    return '/dashboard';
  }
  return trimmed;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly user = signal<AuthUser | null>(null);
  readonly status = signal<AuthStatus>('loading');
  readonly isAuthenticated = computed(() => this.status() === 'authenticated' && this.user() !== null);

  private sessionLoadPromise: Promise<boolean> | null = null;
  private refreshInFlight$: Observable<AuthUser> | null = null;

  ensureSessionLoaded(): Promise<boolean> {
    if (this.status() === 'authenticated') {
      return Promise.resolve(true);
    }
    if (this.status() === 'unauthenticated') {
      return Promise.resolve(false);
    }
    if (this.sessionLoadPromise) {
      return this.sessionLoadPromise;
    }

    this.sessionLoadPromise = firstValueFrom(
      this.http.get<AuthUser>('/api/v1/auth/me', { withCredentials: true })
    )
      .then((user) => {
        this.user.set(user);
        this.status.set('authenticated');
        return true;
      })
      .catch(() => {
        this.user.set(null);
        this.status.set('unauthenticated');
        return false;
      })
      .finally(() => {
        this.sessionLoadPromise = null;
      });

    return this.sessionLoadPromise;
  }

  loadProviders(): Promise<AuthProviders> {
    return firstValueFrom(
      this.http.get<AuthProviders>('/api/v1/auth/providers', { withCredentials: true })
    ).catch(() => ({
      googleEnabled: true,
      devLoginEnabled: false,
    }));
  }

  buildGoogleLoginUrl(returnUrl?: string | null): string {
    const safeReturnUrl = sanitizeReturnUrl(returnUrl);
    return `/api/v1/auth/google/login?returnUrl=${encodeURIComponent(safeReturnUrl)}`;
  }

  startGoogleLogin(returnUrl?: string | null): void {
    window.location.assign(this.buildGoogleLoginUrl(returnUrl));
  }

  async loginAsDev(): Promise<AuthUser> {
    const user = await firstValueFrom(
      this.http.post<AuthUser>('/api/v1/auth/dev-login', {}, { withCredentials: true })
    );
    this.user.set(user);
    this.status.set('authenticated');
    return user;
  }

  refreshSession(): Observable<AuthUser> {
    if (!this.refreshInFlight$) {
      this.refreshInFlight$ = this.http
        .post<AuthUser>('/api/v1/auth/refresh', {}, { withCredentials: true })
        .pipe(
          tap((user) => {
            this.user.set(user);
            this.status.set('authenticated');
          }),
          finalize(() => {
            this.refreshInFlight$ = null;
          }),
          shareReplay(1)
        );
    }
    return this.refreshInFlight$;
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post<void>('/api/v1/auth/logout', {}, { withCredentials: true })
      );
    } catch {
      // Clear local session state even if server logout fails
    } finally {
      this.clearLocalState();
      await this.router.navigate(['/login']);
    }
  }

  clearLocalState(): void {
    this.user.set(null);
    this.status.set('unauthenticated');
    this.sessionLoadPromise = null;
  }
}
