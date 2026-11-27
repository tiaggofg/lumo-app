import { expect, test } from '@playwright/test';

test.describe('Lumo Authentication E2E', () => {
  let pageErrors: string[] = [];

  test.beforeEach(({ page }) => {
    pageErrors = [];
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });
  });

  test.afterEach(() => {
    expect(pageErrors, 'Zero uncaught page errors').toEqual([]);
  });

  test('should redirect anonymous user to /login with returnUrl, login as Dev, persist across reload and logout', async ({
    page,
  }) => {
    await page.goto('/budgets');
    await expect(page).toHaveURL(/\/login\?returnUrl=%2Fbudgets$/);

    // Full-screen login without authenticated shell or error toasts
    await expect(page.getByTestId('desktop-sidebar')).toHaveCount(0);
    await expect(page.getByTestId('lumo-logo')).toBeVisible();
    await expect(page.getByTestId('google-login-button')).toBeVisible();
    await expect(page.getByTestId('dev-login-button')).toBeVisible();
    await expect(page.locator('z-toast-viewport [role="alert"]')).toHaveCount(0);

    // Authenticate via Dev Login -> redirects back to /budgets
    await page.getByTestId('dev-login-button').click();
    await expect(page).toHaveURL(/\/budgets$/);

    // Verify user profile in sidebar (desktop) or drawer (mobile)
    const isDesktop = (page.viewportSize()?.width ?? 1440) >= 1024;
    if (isDesktop) {
      await expect(page.getByTestId('user-profile-desktop')).toContainText('Desenvolvedor Lumo');
    } else {
      await page.getByTestId('mobile-menu-toggle').click();
      await expect(page.getByTestId('user-profile-mobile')).toContainText('Desenvolvedor Lumo');
      await page.getByLabel('Fechar menu').click();
    }

    // Session persists after full page reload
    await page.reload();
    await expect(page).toHaveURL(/\/budgets$/);

    // Authenticated user visiting /login is redirected to /dashboard
    await page.goto('/login');
    await expect(page).toHaveURL(/\/dashboard$/);

    // Logout from desktop sidebar or mobile drawer
    if (isDesktop) {
      await page.getByTestId('logout-button-desktop').click();
    } else {
      await page.getByTestId('mobile-menu-toggle').click();
      await page.getByTestId('logout-button-mobile').click();
    }

    await expect(page).toHaveURL(/\/login$/);

    // Protected route is blocked again after logout
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('should display PT-BR error alerts for OAuth error query params on /login', async ({
    page,
  }) => {
    await page.goto('/login?error=email_not_allowed');
    await expect(page.getByTestId('login-error-alert')).toContainText(
      'Este e-mail não está autorizado'
    );

    await page.goto('/login?error=access_denied');
    await expect(page.getByTestId('login-error-alert')).toContainText(
      'Acesso cancelado na conta Google'
    );
  });
});
