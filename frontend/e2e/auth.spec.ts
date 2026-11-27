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

    // Verify compact footer and user profile popover in sidebar (desktop) or drawer (mobile)
    const isDesktop = (page.viewportSize()?.width ?? 1440) >= 1024;
    if (isDesktop) {
      const avatarBtn = page.getByTestId('user-profile-desktop');
      const themeBtn = page.getByTestId('theme-toggle-desktop');
      await expect(avatarBtn).toBeVisible();
      await expect(themeBtn).toBeVisible();
      await expect(avatarBtn).toHaveAttribute('aria-expanded', 'false');

      // Avatar and theme toggle share the same row in expanded desktop footer
      const avatarBox = await avatarBtn.boundingBox();
      const themeBox = await themeBtn.boundingBox();
      expect(Math.abs((avatarBox?.y ?? 0) - (themeBox?.y ?? 0))).toBeLessThanOrEqual(4);

      // Open profile popover
      await avatarBtn.click();
      await expect(avatarBtn).toHaveAttribute('aria-expanded', 'true');
      const popover = page.getByTestId('user-profile-popover');
      await expect(popover).toBeVisible();
      await expect(popover.getByTestId('profile-popover-initial')).toHaveText('D');
      await expect(popover.getByTestId('profile-popover-name')).toContainText('Desenvolvedor Lumo');
      await expect(popover.getByTestId('profile-popover-email')).toContainText('dev@lumo.local');
      await expect(popover.getByTestId('profile-popover-logout')).toHaveText('Sair');
      await expect(popover).not.toContainText('My profile');
      await expect(popover).not.toContainText('Create team');

      // Close popover with Escape
      await page.keyboard.press('Escape');
      await expect(popover).toHaveCount(0);
      await expect(avatarBtn).toHaveAttribute('aria-expanded', 'false');

      // Open and close by clicking outside
      await avatarBtn.click();
      await expect(popover).toBeVisible();
      await page.locator('main').click({ position: { x: 20, y: 20 } });
      await expect(popover).toHaveCount(0);
    } else {
      await expect(page.locator('header').getByTestId('theme-toggle-mobile')).toHaveCount(0);
      await page.getByTestId('mobile-menu-toggle').click();
      const drawer = page.getByTestId('mobile-drawer');
      const avatarBtn = drawer.getByTestId('user-profile-mobile');
      const themeBtn = drawer.getByTestId('theme-toggle-mobile');
      await expect(avatarBtn).toBeVisible();
      await expect(themeBtn).toBeVisible();

      const avatarBox = await avatarBtn.boundingBox();
      const themeBox = await themeBtn.boundingBox();
      expect(Math.abs((avatarBox?.y ?? 0) - (themeBox?.y ?? 0))).toBeLessThanOrEqual(4);

      await avatarBtn.click();
      const popover = drawer.getByTestId('user-profile-popover');
      await expect(popover).toBeVisible();
      await expect(popover.getByTestId('profile-popover-initial')).toHaveText('D');
      await expect(popover.getByTestId('profile-popover-name')).toContainText('Desenvolvedor Lumo');
      await expect(popover.getByTestId('profile-popover-email')).toContainText('dev@lumo.local');
      await expect(popover).not.toContainText('My profile');

      await page.keyboard.press('Escape');
      await expect(popover).toHaveCount(0);
      await page.getByLabel('Fechar menu').click();
    }

    // Session persists after full page reload
    await page.reload();
    await expect(page).toHaveURL(/\/budgets$/);

    // Authenticated user visiting /login is redirected to /dashboard
    await page.goto('/login');
    await expect(page).toHaveURL(/\/dashboard$/);

    // Logout from profile popover (desktop sidebar or mobile drawer)
    if (isDesktop) {
      await page.getByTestId('user-profile-desktop').click();
      await page.getByTestId('profile-popover-logout').click();
    } else {
      await page.getByTestId('mobile-menu-toggle').click();
      await page.getByTestId('user-profile-mobile').click();
      await page.getByTestId('profile-popover-logout').click();
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
