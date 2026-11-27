import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LumoLogoComponent } from '../../shared/ui';
import { AuthProviders } from '../../core/auth/auth.models';
import { AuthService, sanitizeReturnUrl } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/services/theme.service';

const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'Acesso cancelado na conta Google. Tente novamente quando quiser.',
  invalid_state: 'Sessão de login expirada ou inválida. Inicie o acesso novamente.',
  oauth_failed: 'Não foi possível validar sua conta Google. Tente novamente.',
  email_not_allowed: 'Este e-mail não está autorizado a acessar este ambiente do Lumo.',
  account_disabled: 'Sua conta está desativada.',
  provider_unavailable: 'Serviço de login do Google temporariamente indisponível.',
};

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [LumoLogoComponent],
  template: `
    <div
      class="min-h-dvh w-full flex flex-col items-center justify-center p-5 sm:p-8 bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden"
    >
      <!-- Ambient Glow -->
      <div
        class="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[540px] h-[540px] rounded-full bg-indigo-500/12 dark:bg-indigo-500/15 blur-3xl"
        aria-hidden="true"
      ></div>

      <!-- Theme Toggle -->
      <div class="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
        <button
          type="button"
          data-testid="theme-toggle-login"
          (click)="themeService.toggle()"
          class="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-colors cursor-pointer"
          [attr.aria-label]="themeService.isDark() ? 'Ativar modo claro' : 'Ativar modo escuro'"
        >
          <i
            [class]="themeService.isDark() ? 'pi pi-sun text-amber-500' : 'pi pi-moon text-indigo-600'"
            aria-hidden="true"
          ></i>
          <span class="hidden sm:inline">{{ themeService.isDark() ? 'Modo Claro' : 'Modo Escuro' }}</span>
        </button>
      </div>

      <!-- Login Card -->
      <div
        class="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-900/5 dark:shadow-black/30 p-7 sm:p-9 space-y-6"
      >
        <div class="flex flex-col items-center text-center space-y-3">
          <app-lumo-logo
            variant="full"
            size="lg"
            subtitle="Controle Financeiro"
            [tone]="themeService.isDark() ? 'dark-surface' : 'adaptive'"
          />
          <p class="text-sm text-slate-600 dark:text-slate-400 max-w-xs leading-relaxed">
            Acesse seus orçamentos mensais, lançamentos e recorrências com segurança.
          </p>
        </div>

        @if (errorMessage()) {
          <div
            role="alert"
            data-testid="login-error-alert"
            class="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-200 text-sm"
          >
            <i class="pi pi-exclamation-triangle text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" aria-hidden="true"></i>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <div class="space-y-3">
          <button
            type="button"
            data-testid="google-login-button"
            [disabled]="submitting()"
            (click)="onGoogleLogin()"
            class="w-full h-12 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 text-white font-semibold text-[15px] shadow-sm shadow-indigo-600/20 flex items-center justify-center gap-3 transition-colors cursor-pointer"
          >
            <span class="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0" aria-hidden="true">
              <svg class="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                />
              </svg>
            </span>
            <span>Entrar com Google</span>
          </button>

          @if (providers().devLoginEnabled) {
            <div class="relative py-1 flex items-center" aria-hidden="true">
              <div class="flex-1 border-t border-slate-200 dark:border-slate-800"></div>
              <span class="px-3 text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-medium">
                Ambiente Local
              </span>
              <div class="flex-1 border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            <button
              type="button"
              data-testid="dev-login-button"
              [disabled]="submitting()"
              (click)="onDevLogin()"
              class="w-full h-11 px-4 rounded-xl bg-slate-100 hover:bg-slate-200/90 dark:bg-slate-800 dark:hover:bg-slate-700/90 disabled:opacity-60 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <i class="pi pi-code text-sky-600 dark:text-sky-400" aria-hidden="true"></i>
              <span>{{ submitting() ? 'Entrando...' : 'Entrar como Dev' }}</span>
            </button>
          }
        </div>
      </div>
    </div>
  `,
})
export class LoginPageComponent implements OnInit {
  readonly themeService = inject(ThemeService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly providers = signal<AuthProviders>({ googleEnabled: true, devLoginEnabled: false });
  readonly submitting = signal(false);
  readonly errorCode = signal<string | null>(null);
  readonly returnUrl = signal<string>('/dashboard');

  readonly errorMessage = computed(() => {
    const code = this.errorCode();
    if (!code) {
      return null;
    }
    return LOGIN_ERROR_MESSAGES[code] ?? 'Não foi possível concluir o login. Tente novamente.';
  });

  ngOnInit(): void {
    const queryParams = this.route.snapshot.queryParamMap;
    this.errorCode.set(queryParams.get('error'));
    this.returnUrl.set(sanitizeReturnUrl(queryParams.get('returnUrl')));

    void this.authService.loadProviders().then((p) => this.providers.set(p));
  }

  onGoogleLogin(): void {
    this.submitting.set(true);
    this.authService.startGoogleLogin(this.returnUrl());
  }

  async onDevLogin(): Promise<void> {
    this.submitting.set(true);
    this.errorCode.set(null);
    try {
      await this.authService.loginAsDev();
      await this.router.navigateByUrl(this.returnUrl());
    } catch {
      this.errorCode.set('oauth_failed');
    } finally {
      this.submitting.set(false);
    }
  }
}
