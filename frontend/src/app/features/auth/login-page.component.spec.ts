import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LoginPageComponent } from './login-page.component';

describe('LoginPageComponent', () => {
  function setup(queryParams: Record<string, string> = {}, devLoginEnabled = true) {
    const authServiceMock = {
      loadProviders: vi.fn().mockResolvedValue({ googleEnabled: true, devLoginEnabled }),
      startGoogleLogin: vi.fn(),
      loginAsDev: vi.fn().mockResolvedValue({
        id: 'u1',
        email: 'dev@lumo.local',
        name: 'Desenvolvedor Lumo',
        avatarUrl: null,
      }),
    };

    TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } },
        },
      ],
    });

    const fixture = TestBed.createComponent(LoginPageComponent);
    const router = TestBed.inject(Router);
    fixture.detectChanges();
    return { fixture, authServiceMock, router };
  }

  it('should render Lumo logo, Google login button, and conditional Dev login button', async () => {
    const { fixture, authServiceMock, router } = setup({ returnUrl: '/budgets' }, true);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-lumo-logo')).toBeTruthy();
    const googleBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-testid="google-login-button"]'
    );
    expect(googleBtn).toBeTruthy();
    googleBtn.click();
    expect(authServiceMock.startGoogleLogin).toHaveBeenCalledWith('/budgets');

    const devBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-testid="dev-login-button"]'
    );
    expect(devBtn).toBeTruthy();

    const navSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    await fixture.componentInstance.onDevLogin();
    expect(authServiceMock.loginAsDev).toHaveBeenCalled();
    expect(navSpy).toHaveBeenCalledWith('/budgets');
  });

  it('should hide Dev login button when devLoginEnabled is false', async () => {
    const { fixture } = setup({}, false);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="dev-login-button"]')).toBeNull();
  });

  it('should render PT-BR error alerts for all mapped OAuth error codes and sanitize evil returnUrl', () => {
    const { fixture, authServiceMock } = setup(
      { error: 'email_not_allowed', returnUrl: 'https://evil.com' },
      false
    );

    const alert: HTMLElement | null = fixture.nativeElement.querySelector(
      '[data-testid="login-error-alert"]'
    );
    expect(alert?.textContent).toContain('Este e-mail não está autorizado');

    fixture.componentInstance.onGoogleLogin();
    expect(authServiceMock.startGoogleLogin).toHaveBeenCalledWith('/dashboard');
  });
});
