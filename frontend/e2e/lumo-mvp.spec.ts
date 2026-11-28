import { expect, test } from '@playwright/test';

const API_BASE = process.env['LUMO_API_URL'] || 'http://localhost:8080/api/v1';

async function resetTestData(request: import('@playwright/test').APIRequestContext): Promise<void> {
  // Authenticate API context via dev-login
  const authRes = await request.post(`${API_BASE}/auth/dev-login`);
  expect(authRes.ok(), 'Dev login for E2E reset should succeed').toBe(true);

  // Clean up any budgets, transactions, and recurrences created by previous test runs
  const budgetsRes = await request.get(`${API_BASE}/budgets`);
  if (budgetsRes.ok()) {
    const budgets: { id: string }[] = await budgetsRes.json();
    for (const b of budgets) {
      const txnsRes = await request.get(`${API_BASE}/budgets/${b.id}/transactions`);
      if (txnsRes.ok()) {
        const txns: { id: string }[] = await txnsRes.json();
        for (const t of txns) {
          await request.delete(`${API_BASE}/transactions/${t.id}`);
        }
      }
      await request.delete(`${API_BASE}/budgets/${b.id}`);
    }
  }

  const recRes = await request.get(`${API_BASE}/recurring-transactions`);
  if (recRes.ok()) {
    const recs: { id: string; active: boolean; hasGeneratedTransactions: boolean }[] =
      await recRes.json();
    for (const r of recs) {
      if (!r.hasGeneratedTransactions) {
        await request.delete(`${API_BASE}/recurring-transactions/${r.id}`);
      } else if (r.active) {
        await request.patch(`${API_BASE}/recurring-transactions/${r.id}/deactivate`, {
          data: { removeFutureOpenTransactions: true },
        });
      }
    }
  }
}

test.describe('Lumo MVP Full-Stack E2E', () => {
  let consoleErrors: string[] = [];
  let pageErrors: string[] = [];

  test.beforeEach(async ({ page, request }) => {
    consoleErrors = [];
    pageErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });
    await resetTestData(request);
    const browserAuth = await page.request.post('/api/v1/auth/dev-login');
    expect(browserAuth.ok(), 'Dev login for browser E2E context should succeed').toBe(true);
  });

  test.afterEach(() => {
    expect(pageErrors, 'Zero uncaught page errors').toEqual([]);
    expect(consoleErrors, 'Zero console errors').toEqual([]);
  });

  test('dashboard default route and navigation, dashboard and typography scale', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByTestId('dashboard-empty-state')).toBeVisible();

    // Verify 100% absence of PrimeNG license banner
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Invalid PrimeUI License');

    // Verify Lumo SVG brand assets (/favicon.svg & /site.webmanifest)
    const favRes = await page.request.get('/favicon.svg');
    expect(favRes.ok()).toBe(true);
    expect(await favRes.text()).toContain('#4F46E5');

    const manifestRes = await page.request.get('/site.webmanifest');
    expect(manifestRes.ok()).toBe(true);
    expect(await manifestRes.text()).toContain('Lumo');

    const isDesktop = (page.viewportSize()?.width ?? 1440) >= 1024;
    if (isDesktop) {
      await expect(page.getByTestId('desktop-sidebar').getByTestId('lumo-logo')).toBeVisible();
    } else {
      await expect(page.locator('header').getByTestId('lumo-logo')).toBeVisible();
    }

    const mainClass = await page.locator('main').getAttribute('class');
    expect(mainClass).toContain('w-full');
    expect(mainClass).not.toContain('max-w-7xl');

    const bodyStyle = await page.evaluate(() => {
      const style = window.getComputedStyle(document.body);
      return {
        fontSize: style.fontSize,
        fontFamily: style.fontFamily,
        backgroundColor: style.backgroundColor,
      };
    });
    expect(bodyStyle.fontSize).toBe('16px');
    expect(bodyStyle.fontFamily).toContain('Plus Jakarta Sans');
    // Light mode canvas is slate-100 (#F1F5F9 -> rgb(241, 245, 249))
    expect(bodyStyle.backgroundColor).toBe('rgb(241, 245, 249)');

    if (isDesktop) {
      const sidebar = page.getByTestId('desktop-sidebar');
      await expect(sidebar).toBeVisible();

      const sidebarBox = await sidebar.boundingBox();
      expect(sidebarBox?.height).toBe(900);
      expect(sidebarBox?.width).toBe(272);

      const sidebarClass = await sidebar.getAttribute('class');
      expect(sidebarClass).toContain('bg-slate-900');
      expect(sidebarClass).toContain('h-dvh');
      expect(sidebarClass).toContain('sticky');

      // Collapse sidebar to icon-only rail (w-20 / 80px)
      await page.getByTestId('sidebar-collapse-toggle').click();
      await expect(sidebar).toHaveAttribute('data-collapsed', 'true');
      await expect
        .poll(async () => (await sidebar.boundingBox())?.width)
        .toBe(80);

      // Reload and confirm collapsed state persists from localStorage
      await page.reload();
      await expect(page.getByTestId('desktop-sidebar')).toHaveAttribute('data-collapsed', 'true');

      // Expand sidebar back to w-68 (272px)
      await page.getByTestId('sidebar-collapse-toggle').click();
      await expect(page.getByTestId('desktop-sidebar')).toHaveAttribute('data-collapsed', 'false');
    }

    const bodyHtml = await page.locator('body').innerHTML();
    expect(bodyHtml).not.toContain('emerald-');

    await page.getByTestId('dashboard-empty-create-btn').click();
    await expect(page).toHaveURL(/\/budgets$/);
  });

  test('budgets list and create flow', async ({ page }) => {
    await page.goto('/budgets');
    await expect(page.getByTestId('budgets-empty-state')).toBeVisible();
    expect(await page.locator('body').innerText()).not.toContain('Invalid PrimeUI License');

    await page.getByTestId('empty-create-budget-btn').click();
    await page.getByTestId('competence-month-input').fill('2026-11');
    await page.getByTestId('confirm-create-budget-btn').click();

    await expect(page).toHaveURL(/\/budgets\/[0-9a-f-]+$/);
    await expect(page.getByTestId('budget-detail-title')).toContainText('Novembro 2026');
    await expect(page.getByTestId('summary-planned-balance')).toContainText('R$');
  });

  test('catalog categories and beneficiaries', async ({ page }) => {
    const suffix = Date.now().toString().slice(-5);
    const catName = `Pets E2E ${suffix}`;
    const benName = `Tiago E2E ${suffix}`;

    await page.goto('/catalog');
    await expect(page.getByText('Moradia')).toBeVisible();
    expect(await page.locator('body').innerText()).not.toContain('Invalid PrimeUI License');

    await page.getByTestId('new-category-btn').click();
    await page.locator('#cat-name').fill(catName);
    await page.getByTestId('save-category-btn').click();
    await expect(page.getByText(catName)).toBeVisible();

    await page.getByTestId('tab-beneficiaries').click();
    await expect(page.getByText('Família', { exact: true })).toBeVisible();

    await page.getByTestId('new-beneficiary-btn').click();
    await page.locator('#ben-name').fill(benName);
    await page.getByTestId('save-beneficiary-btn').click();
    await expect(page.getByText(benName)).toBeVisible();
  });

  test('recurrences lifecycle and automatic materialization', async ({ page, request }) => {
    const suffix = Date.now().toString().slice(-5);
    const aguaName = `Água E2E ${suffix}`;
    const aluguelName = `Aluguel E2E ${suffix}`;

    // Create an ESTIMATED recurrence via API + a FIXED recurrence via UI
    await request.post(`${API_BASE}/recurring-transactions`, {
      data: {
        type: 'EXPENSE',
        description: aguaName,
        amount: 180.0,
        amountType: 'ESTIMATED',
        recurrenceType: 'INDEFINITE',
        startMonth: '2026-10',
        dueDay: 20,
      },
    });

    await page.goto('/recurrences');
    await expect(page.getByTestId(`recurrence-card-${aguaName}`)).toBeVisible();
    expect(await page.locator('body').innerText()).not.toContain('Invalid PrimeUI License');

    await page.getByRole('button', { name: 'Nova Recorrência' }).click();
    await page.getByTestId('rec-description-input').fill(aluguelName);
    await page.locator('#rec-amount').click();
    await page.locator('#rec-amount').fill('800');
    await page.locator('#rec-start-month').fill('2026-10');
    await page.getByTestId('rec-save-btn').click();

    await expect(page.getByTestId(`recurrence-card-${aluguelName}`)).toBeVisible();

    // Create budget 2026-11 and verify both recurrences materialized automatically
    await page.goto('/budgets');
    await page.getByRole('button', { name: 'Novo Orçamento' }).click();
    await page.getByTestId('competence-month-input').fill('2026-11');
    await page.getByRole('button', { name: 'Criar Orçamento' }).click();

    const isDesktop = (page.viewportSize()?.width ?? 1440) >= 1024;
    const listContainer = page.getByTestId(
      isDesktop ? 'transactions-table' : 'transactions-mobile-cards'
    );
    await expect(listContainer.getByText(aguaName)).toBeVisible();
    await expect(listContainer.getByText(aluguelName)).toBeVisible();
  });

  test('budget detail settle and confirm estimate', async ({ page, request }) => {
    const budgetRes = await request.post(`${API_BASE}/budgets`, {
      data: { competenceMonth: '2026-11' },
    });
    const budget: { id: string } = await budgetRes.json();

    await request.post(`${API_BASE}/budgets/${budget.id}/transactions`, {
      data: {
        type: 'INCOME',
        description: 'Salário E2E',
        amount: 6362.29,
        status: 'SETTLED',
        categoryId: '10000000-0000-0000-0000-000000000010',
        beneficiaryId: '20000000-0000-0000-0000-000000000001',
      },
    });

    await request.post(`${API_BASE}/budgets/${budget.id}/transactions`, {
      data: {
        type: 'EXPENSE',
        description: 'Aluguel E2E',
        amount: 800.0,
        status: 'PENDING',
        dueDate: '2026-11-05',
        categoryId: '10000000-0000-0000-0000-000000000001',
        beneficiaryId: '20000000-0000-0000-0000-000000000001',
      },
    });

    await request.post(`${API_BASE}/budgets/${budget.id}/transactions`, {
      data: {
        type: 'EXPENSE',
        description: 'Água E2E',
        amount: 180.0,
        status: 'ESTIMATED',
        dueDate: '2026-11-20',
        categoryId: '10000000-0000-0000-0000-000000000002',
        beneficiaryId: '20000000-0000-0000-0000-000000000001',
      },
    });

    await page.goto(`/budgets/${budget.id}`);
    await expect(page.getByTestId('summary-planned-income')).toContainText('6.362,29');
    await expect(page.getByTestId('summary-planned-expense')).toContainText('980,00');
    await expect(page.getByTestId('summary-realized-expense')).toContainText('0,00');
    expect(await page.locator('body').innerText()).not.toContain('Invalid PrimeUI License');

    // Charts must NOT be embedded in /budgets/:id; shortcut to /dashboard must be visible
    await expect(page.getByTestId('budget-charts')).toHaveCount(0);
    await expect(page.getByTestId('open-dashboard-charts-btn')).toBeVisible();

    // 1-click settle on Aluguel E2E (works on both desktop table & mobile card)
    const isDesktop = (page.viewportSize()?.width ?? 1440) >= 1024;
    if (isDesktop) {
      const statusHeader = page.getByTestId('status-column-header');
      await expect(statusHeader).toBeVisible();
      await expect(statusHeader).toHaveText('Status');
      await expect(statusHeader).toHaveAttribute(
        'data-tooltip',
        /Clique no status de qualquer lançamento para alternar/
      );

      const toggleBtn = page.getByTestId('toggle-status-Aluguel E2E');
      await expect(toggleBtn).toHaveAttribute('data-tooltip', 'Clique para marcar como Pago');
      await toggleBtn.click();
    } else {
      await page
        .getByTestId('transactions-mobile-cards')
        .locator('div', { hasText: 'Aluguel E2E' })
        .getByRole('button', { name: /Pendente/i })
        .first()
        .click();
    }

    await expect(page.getByTestId('summary-realized-expense')).toContainText('800,00');
    if (isDesktop) {
      await expect(page.getByTestId('toggle-status-Aluguel E2E')).toHaveAttribute(
        'data-tooltip',
        'Clique para reverter para Pendente'
      );
    }

    // Confirm estimate on Água E2E
    if (isDesktop) {
      await page.getByTestId('confirm-estimate-btn-Água E2E').click();
    } else {
      await page
        .getByTestId('transactions-mobile-cards')
        .getByRole('button', { name: /Confirmar/i })
        .first()
        .click();
    }

    await page.locator('#estimate-amount').click();
    await page.locator('#estimate-amount').fill('195,64');
    await page.getByTestId('confirm-estimate-submit').click();

    await expect(page.getByTestId('summary-planned-expense')).toContainText('995,64');
  });

  test('dashboard multi-color charts and dark mode persistence', async ({ page, request }) => {
    const octBudgetRes = await request.post(`${API_BASE}/budgets`, {
      data: { competenceMonth: '2026-10' },
    });
    const octBudget: { id: string } = await octBudgetRes.json();

    await request.post(`${API_BASE}/budgets/${octBudget.id}/transactions`, {
      data: {
        type: 'INCOME',
        description: 'Salário Outubro',
        amount: 6000.0,
        status: 'SETTLED',
        categoryId: '10000000-0000-0000-0000-000000000010',
        beneficiaryId: '20000000-0000-0000-0000-000000000001',
      },
    });

    const budgetRes = await request.post(`${API_BASE}/budgets`, {
      data: { competenceMonth: '2026-11' },
    });
    const budget: { id: string } = await budgetRes.json();

    await request.post(`${API_BASE}/budgets/${budget.id}/transactions`, {
      data: {
        type: 'INCOME',
        description: 'Salário Novembro',
        amount: 7000.0,
        status: 'SETTLED',
        categoryId: '10000000-0000-0000-0000-000000000010',
        beneficiaryId: '20000000-0000-0000-0000-000000000001',
      },
    });

    await request.post(`${API_BASE}/budgets/${budget.id}/transactions`, {
      data: {
        type: 'EXPENSE',
        description: 'Aluguel Chart',
        amount: 1200.0,
        status: 'SETTLED',
        categoryId: '10000000-0000-0000-0000-000000000001',
        beneficiaryId: '20000000-0000-0000-0000-000000000001',
      },
    });

    await request.post(`${API_BASE}/budgets/${budget.id}/transactions`, {
      data: {
        type: 'EXPENSE',
        description: 'Energia Chart',
        amount: 400.0,
        status: 'ESTIMATED',
        categoryId: '10000000-0000-0000-0000-000000000002',
        beneficiaryId: '20000000-0000-0000-0000-000000000001',
      },
    });

    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-kpi-cards')).toBeVisible();
    await expect(page.getByTestId('z-chart-container')).toHaveCount(4);
    await expect(page.getByTestId('chart-category')).toBeVisible();
    await expect(page.getByTestId('chart-category-center')).toContainText('1.600,00');
    await expect(page.getByTestId('chart-beneficiary')).toBeVisible();
    await expect(page.getByTestId('chart-status')).toBeVisible();
    await expect(page.getByTestId('chart-status-center')).toContainText('75%');
    await expect(page.getByTestId('chart-evolution')).toBeVisible();
    await expect(page.getByTestId('category-breakdown-list')).toContainText('75%');
    await expect(page.getByTestId('category-breakdown-list')).toContainText('25%');

    const isDesktop = (page.viewportSize()?.width ?? 1440) >= 1024;
    if (isDesktop) {
      // Verify all 4 KPI cards on the row share the exact same height
      const kpiCards = page.getByTestId('dashboard-kpi-cards').locator('> div');
      const kpi0 = await kpiCards.nth(0).boundingBox();
      const kpi3 = await kpiCards.nth(3).boundingBox();
      expect(kpi0?.height).toBeGreaterThan(0);
      expect(Math.abs((kpi0?.height ?? 0) - (kpi3?.height ?? 0))).toBeLessThanOrEqual(1);

      // Verify left and right chart cards in each row share the exact same height
      const chartCards = page.getByTestId('z-chart-container');
      const chart0 = await chartCards.nth(0).boundingBox();
      const chart1 = await chartCards.nth(1).boundingBox();
      const chart2 = await chartCards.nth(2).boundingBox();
      const chart3 = await chartCards.nth(3).boundingBox();
      expect(Math.abs((chart0?.height ?? 0) - (chart1?.height ?? 0))).toBeLessThanOrEqual(1);
      expect(Math.abs((chart2?.height ?? 0) - (chart3?.height ?? 0))).toBeLessThanOrEqual(1);
    }

    // Interactive legend pill click in ZardUI chart container
    const incomeLegendBtn = page.getByTestId('z-chart-legend-item-income');
    await expect(incomeLegendBtn).toHaveAttribute('aria-pressed', 'true');
    await incomeLegendBtn.click();
    await expect(incomeLegendBtn).toHaveAttribute('aria-pressed', 'false');

    if (isDesktop) {
      await page.getByTestId('theme-toggle-desktop').click();
    } else {
      await expect(page.locator('header').getByTestId('theme-toggle-mobile')).toHaveCount(0);
      await page.getByTestId('mobile-menu-toggle').click();
      await page.getByTestId('mobile-drawer').getByTestId('theme-toggle-mobile').click();
      await page.getByLabel('Fechar menu').click();
    }

    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.getByTestId('chart-category')).toBeVisible();
    await expect(page.getByTestId('chart-evolution')).toBeVisible();
  });

  test('UI polish: viewport-fixed searchable selects, aligned KPI footers, 3-zone recurrence cards, and slim scrollbars', async ({
    page,
    request,
  }) => {
    const isDesktop = (page.viewportSize()?.width ?? 1440) >= 1024;

    // Seed two budgets so Dashboard month selector can filter across months
    const marRes = await request.post(`${API_BASE}/budgets`, {
      data: { competenceMonth: '2026-03' },
    });
    expect(marRes.ok()).toBe(true);

    const novRes = await request.post(`${API_BASE}/budgets`, {
      data: { competenceMonth: '2026-11' },
    });
    expect(novRes.ok()).toBe(true);
    const novBudget: { id: string } = await novRes.json();

    await request.post(`${API_BASE}/budgets/${novBudget.id}/transactions`, {
      data: {
        type: 'INCOME',
        description: 'Salário UI Polish',
        amount: 7500.0,
        status: 'SETTLED',
        categoryId: '10000000-0000-0000-0000-000000000010',
        beneficiaryId: '20000000-0000-0000-0000-000000000001',
      },
    });
    await request.post(`${API_BASE}/budgets/${novBudget.id}/transactions`, {
      data: {
        type: 'EXPENSE',
        description: 'Aluguel UI Polish',
        amount: 1500.0,
        status: 'SETTLED',
        categoryId: '10000000-0000-0000-0000-000000000001',
        beneficiaryId: '20000000-0000-0000-0000-000000000001',
      },
    });
    await request.post(`${API_BASE}/budgets/${novBudget.id}/transactions`, {
      data: {
        type: 'EXPENSE',
        description: 'Água UI Polish',
        amount: 500.0,
        status: 'PENDING',
        categoryId: '10000000-0000-0000-0000-000000000002',
        beneficiaryId: '20000000-0000-0000-0000-000000000001',
      },
    });

    // 1. Budget Detail: KPI footer alignment & progress bar above divider
    await page.goto(`/budgets/${novBudget.id}`);
    await expect(page.getByTestId('budget-summary-cards')).toBeVisible();
    await expect(page.getByTestId('expense-paid-progress')).toContainText('75% pago');

    const progressBox = await page.getByTestId('expense-paid-progress').boundingBox();
    const incomeFooterBox = await page.getByTestId('kpi-footer-income').boundingBox();
    const expenseFooterBox = await page.getByTestId('kpi-footer-expense').boundingBox();
    const balanceFooterBox = await page.getByTestId('kpi-footer-balance').boundingBox();

    expect(progressBox).toBeTruthy();
    expect(incomeFooterBox).toBeTruthy();
    expect(expenseFooterBox).toBeTruthy();
    expect(balanceFooterBox).toBeTruthy();
    expect((progressBox?.y ?? 0) + (progressBox?.height ?? 0)).toBeLessThanOrEqual(
      (expenseFooterBox?.y ?? 0) + 1
    );

    if (isDesktop) {
      expect(
        Math.abs((incomeFooterBox?.y ?? 0) - (expenseFooterBox?.y ?? 0))
      ).toBeLessThanOrEqual(2);
      expect(
        Math.abs((balanceFooterBox?.y ?? 0) - (expenseFooterBox?.y ?? 0))
      ).toBeLessThanOrEqual(2);
    }

    // 2. Viewport-fixed <z-select> inside <z-dialog> (no scrollHeight increase, accent-insensitive search, Escape keeps dialog open)
    await page.getByTestId('new-transaction-btn').click();
    await expect(page.getByTestId('z-dialog-overlay')).toBeVisible();

    const dialogBody = page.getByTestId('z-dialog-body');
    const scrollBefore = await dialogBody.evaluate((el) => el.scrollHeight);

    await page.locator('#txn-category').click();
    const panel = page.getByTestId('z-select-panel');
    await expect(panel).toBeVisible();

    const panelMetrics = await panel.evaluate((el) => {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        position: style.position,
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
        vw: window.innerWidth,
        vh: window.innerHeight,
      };
    });
    expect(panelMetrics.position).toBe('fixed');
    expect(panelMetrics.left).toBeGreaterThanOrEqual(0);
    expect(panelMetrics.right).toBeLessThanOrEqual(panelMetrics.vw + 1);
    expect(panelMetrics.top).toBeGreaterThanOrEqual(0);
    expect(panelMetrics.bottom).toBeLessThanOrEqual(panelMetrics.vh + 1);

    const scrollAfter = await dialogBody.evaluate((el) => el.scrollHeight);
    expect(scrollAfter).toBe(scrollBefore);

    const catSearch = page.getByTestId('z-select-search');
    await expect(catSearch).toBeVisible();
    await catSearch.fill('alimentacao');
    await expect(panel.getByRole('option', { name: 'Alimentação' })).toBeVisible();

    // First Escape closes only the open select popover, keeping the dialog open
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(page.getByTestId('z-dialog-overlay')).toBeVisible();

    // Reopen category, filter without accent and select option
    await page.locator('#txn-category').click();
    await expect(page.getByTestId('z-select-search')).toHaveValue('');
    await page.getByTestId('z-select-search').fill('alimentacao');
    await page.getByTestId('z-select-panel').getByRole('option', { name: 'Alimentação' }).click();
    await expect(page.locator('#txn-category')).toContainText('Alimentação');

    // Beneficiary select is searchable
    await page.locator('#txn-beneficiary').click();
    await expect(page.getByTestId('z-select-search')).toBeVisible();
    await page.getByTestId('z-select-search').fill('familia');
    await page.getByTestId('z-select-panel').getByRole('option', { name: 'Família' }).click();
    await expect(page.locator('#txn-beneficiary')).toContainText('Família');

    // Short fixed select (Type) omits search input
    await page.locator('#txn-type').click();
    await expect(page.getByTestId('z-select-panel')).toBeVisible();
    await expect(page.getByTestId('z-select-search')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('z-select-panel')).toHaveCount(0);
    await expect(page.getByTestId('z-dialog-overlay')).toBeVisible();

    // Second Escape with no select open closes the dialog
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('z-dialog-overlay')).toHaveCount(0);

    // 3. Dashboard searchable month selector
    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-month-selector')).toBeVisible();
    await page
      .getByTestId('dashboard-month-selector')
      .getByTestId('z-select-trigger')
      .click();
    await expect(page.getByTestId('z-select-search')).toBeVisible();
    await page.getByTestId('z-select-search').fill('marco');
    await page.getByTestId('z-select-panel').getByRole('option', { name: 'Março 2026' }).click();
    await expect(page.getByTestId('dashboard-title')).toContainText('Março 2026');

    // 4. Recurrence cards in 3 clean zones + maintenance actions
    const suffix = Date.now().toString().slice(-5);
    const richRecName = `Internet Fibra ${suffix}`;
    const minRecName = `Academia ${suffix}`;

    const r1 = await request.post(`${API_BASE}/recurring-transactions`, {
      data: {
        type: 'EXPENSE',
        description: richRecName,
        amount: 149.9,
        amountType: 'FIXED',
        recurrenceType: 'INDEFINITE',
        startMonth: '2026-11',
        dueDay: 15,
        categoryId: '10000000-0000-0000-0000-000000000002',
        beneficiaryId: '20000000-0000-0000-0000-000000000001',
        notes: 'Débito automático mensal',
      },
    });
    expect(r1.ok()).toBe(true);

    const r2 = await request.post(`${API_BASE}/recurring-transactions`, {
      data: {
        type: 'EXPENSE',
        description: minRecName,
        amount: 99.9,
        amountType: 'ESTIMATED',
        recurrenceType: 'FIXED_TERM',
        startMonth: '2027-01',
        endMonth: '2027-06',
      },
    });
    expect(r2.ok()).toBe(true);

    await page.goto('/recurrences');
    const richCard = page.getByTestId(`recurrence-card-${richRecName}`);
    const minCard = page.getByTestId(`recurrence-card-${minRecName}`);
    await expect(richCard).toBeVisible();
    await expect(minCard).toBeVisible();

    await expect(richCard.getByTestId('recurrence-card-header')).toContainText(richRecName);
    await expect(richCard.getByTestId('recurrence-card-status')).toContainText('Ativa');
    await expect(richCard.getByTestId('recurrence-card-category')).toContainText('Contas Básicas');
    await expect(richCard.getByTestId('recurrence-card-beneficiary')).toContainText('Família');
    await expect(richCard.getByTestId('recurrence-card-notes')).toContainText('Débito automático');
    expect(await richCard.innerText()).not.toContain('•');
    expect(await minCard.innerText()).not.toContain('•');
    await expect(minCard.getByTestId('recurrence-card-category')).toHaveCount(0);

    if (isDesktop) {
      const boxRich = await richCard.boundingBox();
      const boxMin = await minCard.boundingBox();
      expect(Math.abs((boxRich?.height ?? 0) - (boxMin?.height ?? 0))).toBeLessThanOrEqual(2);
      const footRich = await richCard.getByTestId('recurrence-card-footer').boundingBox();
      const footMin = await minCard.getByTestId('recurrence-card-footer').boundingBox();
      expect(Math.abs((footRich?.y ?? 0) - (footMin?.y ?? 0))).toBeLessThanOrEqual(2);
    }

    // Deactivate & reactivate rich card
    await richCard.getByTestId('recurrence-deactivate-btn').click();
    await page.getByTestId('confirm-deactivate-btn').click();
    await expect(richCard.getByTestId('recurrence-card-status')).toContainText('Inativa');
    await expect(richCard.getByTestId('recurrence-activate-btn')).toBeVisible();

    await richCard.getByTestId('recurrence-activate-btn').click();
    await expect(richCard.getByTestId('recurrence-card-status')).toContainText('Ativa');

    // Edit modal has searchable category select
    await richCard.getByTestId('recurrence-edit-btn').click();
    await expect(page.getByTestId('z-dialog-overlay')).toBeVisible();
    await page.locator('#rec-cat').click();
    await expect(page.getByTestId('z-select-search')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('z-dialog-overlay')).toHaveCount(0);

    // Delete recurrence that has never generated transactions
    await minCard.getByTestId('recurrence-delete-btn').click();
    await page.getByTestId('z-confirm-accept').click();
    await expect(minCard).toHaveCount(0);

    // 5. Global slim scrollbars in Light Mode, Dark Mode, and dark sidebar
    const lightScrollbar = await page.evaluate(() => {
      const rootStyle = window.getComputedStyle(document.documentElement);
      const asideEl = document.querySelector('aside');
      const asideStyle = asideEl ? window.getComputedStyle(asideEl) : null;
      return {
        rootWidth: rootStyle.scrollbarWidth,
        rootThumb: rootStyle.getPropertyValue('--lumo-scrollbar-thumb').trim(),
        asideThumb: asideStyle?.getPropertyValue('--lumo-scrollbar-thumb').trim() ?? '',
      };
    });
    expect(lightScrollbar.rootWidth).toBe('thin');
    expect(lightScrollbar.rootThumb).not.toBe('');
    if (isDesktop) {
      expect(lightScrollbar.asideThumb).not.toBe('');
      expect(lightScrollbar.asideThumb).not.toBe(lightScrollbar.rootThumb);
    }

    if (isDesktop) {
      await page.getByTestId('theme-toggle-desktop').click();
    } else {
      await page.getByTestId('mobile-menu-toggle').click();
      await page.getByTestId('mobile-drawer').getByTestId('theme-toggle-mobile').click();
      await page.getByLabel('Fechar menu').click();
    }

    await expect(page.locator('html')).toHaveClass(/dark/);
    const darkScrollbar = await page.evaluate(() => {
      const rootStyle = window.getComputedStyle(document.documentElement);
      return {
        rootWidth: rootStyle.scrollbarWidth,
        rootThumb: rootStyle.getPropertyValue('--lumo-scrollbar-thumb').trim(),
      };
    });
    expect(darkScrollbar.rootWidth).toBe('thin');
    expect(darkScrollbar.rootThumb).not.toBe('');
    expect(darkScrollbar.rootThumb).not.toBe(lightScrollbar.rootThumb);
  });
});
